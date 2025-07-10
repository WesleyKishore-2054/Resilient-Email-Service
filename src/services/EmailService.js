const retryWithBackoff = require('../utils/retryWithBackoff');
const RateLimiter = require('../utils/RateLimiter');
const CircuitBreaker = require('../utils/CircuitBreaker');
const crypto = require('crypto');

function generateEmailId(email) {
    const raw = `${email.to}::${email.subject}::${email.body}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
}

class EmailService {
    constructor(providers) {
        this.providers = providers;
        this.statusMap = new Map();
        this.sentEmails = new Set(); // prevent duplicates
        this.rateLimiter = new RateLimiter(10, 60000); // 10 emails/minute
        this.circuitBreakers = new Map(); // one breaker per provider

        this.providers.forEach(provider => {
            this.circuitBreakers.set(provider.name, new CircuitBreaker(3, 10000)); // 3 failures = open for 10s
        });
    }

    async send(email) {
        const emailId = generateEmailId(email);
        const emailLabel = `FROM: ${email.from} → TO: ${email.to}`;

        console.log(`[INFO] Attempting to send email: ${emailLabel}`);

        // Idempotency check
        if (this.sentEmails.has(emailId)) {
            console.log(`[SKIP] Email already sent (duplicate) for ${emailLabel}`);
            this.statusMap.set(emailId, 'duplicate');
            return 'duplicate email, already sent';
        }

        // Rate limiting
        if (!this.rateLimiter.allow()) {
            console.log(`[WARN] Rate limit exceeded for ${emailLabel}`);
            this.statusMap.set(emailId, 'rate limited');
            throw new Error('Rate limit exceeded, try again later');
        }

        // Attempt with providers
        for (let provider of this.providers) {
            const breaker = this.circuitBreakers.get(provider.name);

            if (!breaker.canRequest()) {
                console.log(`[SKIP] ${provider.name} skipped (circuit open) for ${emailLabel}`);
                this.statusMap.set(emailId, `${provider.name} skipped (circuit open)`);
                continue;
            }

            console.log(`[TRY] Trying ${provider.name} for ${emailLabel}`);

            try {
                const result = await retryWithBackoff(() => provider.send(email));
                console.log(`[SUCCESS] ${provider.name} sent email: ${emailLabel}`);
                console.log(`[HASHED] Email ID: ${emailId}`);
                this.sentEmails.add(emailId);
                this.statusMap.set(emailId, `sent via ${provider.name}`);
                breaker.recordSuccess();
                return result;
            } catch (error) {
                console.log(`[FAIL] ${provider.name} failed for ${emailLabel}: ${error.message}`);
                this.statusMap.set(emailId, `failed via ${provider.name}: ${error.message}`);
                breaker.recordFailure();
            }
        }

        console.log(`[FINAL FAIL] All providers failed for ${emailLabel}`);
        this.statusMap.set(emailId, 'failed: all providers');
        throw new Error(`Failed to send email after trying all providers: ${emailLabel}`);
    }
}

module.exports = EmailService;
