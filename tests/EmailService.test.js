const EmailService = require('../src/services/EmailService');
const RateLimiter = require('../src/utils/RateLimiter');
const CircuitBreaker = require('../src/utils/CircuitBreaker');
const crypto = require('crypto');

jest.mock('../src/utils/retryWithBackoff', () => jest.fn(fn => fn()));

class MockProvider {
    constructor(name, shouldFail = false) {
        this.name = name;
        this.shouldFail = shouldFail;
        this.send = jest.fn(async () => {
            if (this.shouldFail) throw new Error(`${this.name} failed`);
            return `${this.name} sent email`;
        });
    }
}

function generateEmailId(email) {
    const raw = `${email.to}::${email.subject}::${email.body}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
}

describe('EmailService', () => {
    let providerA, providerB, emailService;

    beforeEach(() => {
        providerA = new MockProvider('ProviderA');
        providerB = new MockProvider('ProviderB');
        emailService = new EmailService([providerA, providerB]);
    });

    const baseEmail = {
        from: 'test@sender.com',
        to: 'user@example.com',
        subject: 'Test Subject',
        body: 'Test Body'
    };

    test('sends email successfully with first provider', async () => {
        const result = await emailService.send(baseEmail);
        const emailId = generateEmailId(baseEmail);
        expect(result).toBe('ProviderA sent email');
        expect(providerA.send).toHaveBeenCalled();
        expect(emailService.statusMap.get(emailId)).toMatch(/sent via ProviderA/);
    });

    test('falls back to second provider on failure', async () => {
        providerA.shouldFail = true;
        const email = { ...baseEmail, to: 'fallback@example.com' };
        const emailId = generateEmailId(email);
        const result = await emailService.send(email);
        expect(providerB.send).toHaveBeenCalled();
        expect(emailService.statusMap.get(emailId)).toMatch(/sent via ProviderB/);
    });

    test('fails when all providers fail', async () => {
        providerA.shouldFail = true;
        providerB.shouldFail = true;
        const email = { ...baseEmail, to: 'failall@example.com' };
        const emailId = generateEmailId(email);
        await expect(emailService.send(email)).rejects.toThrow(/Failed to send email/);
        expect(emailService.statusMap.get(emailId)).toBe('failed: all providers');
    });

    test('prevents duplicate sends (idempotency)', async () => {
        const result1 = await emailService.send(baseEmail);
        const result2 = await emailService.send(baseEmail);
        const emailId = generateEmailId(baseEmail);
        expect(result2).toBe('duplicate email, already sent');
        expect(emailService.statusMap.get(emailId)).toBe('duplicate');
    });

    test('enforces rate limiting', async () => {
        emailService.rateLimiter = new RateLimiter(1, 60000);
        const email1 = { ...baseEmail, to: 'r1@example.com' };
        const email2 = { ...baseEmail, to: 'r2@example.com' };
        await emailService.send(email1);
        await expect(emailService.send(email2))
            .rejects.toThrow('Rate limit exceeded');
        const emailId2 = generateEmailId(email2);
        expect(emailService.statusMap.get(emailId2)).toBe('rate limited');
    });

    test('skips provider if circuit breaker is open', async () => {
        const breaker = emailService.circuitBreakers.get('ProviderA');
        breaker.recordFailure();
        breaker.recordFailure();
        breaker.recordFailure();

        const email = { ...baseEmail, to: 'cbtest@example.com' };
        const emailId = generateEmailId(email);
        const result = await emailService.send(email);
        expect(emailService.statusMap.get(emailId)).toMatch(/sent via ProviderB/);
        expect(providerA.send).not.toHaveBeenCalled();
    });

    test('records failure and opens circuit after threshold', async () => {
        const breaker = emailService.circuitBreakers.get('ProviderA');
        providerA.shouldFail = true;

        for (let i = 0; i < 3; i++) {
            const email = { ...baseEmail, to: `fail${i}@test.com` };
            try {
                await emailService.send(email);
            } catch (_) {}
        }

        expect(breaker.state).toBe('OPEN');
    });
});
