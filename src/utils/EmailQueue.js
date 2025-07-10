const crypto = require('crypto');

class EmailQueue {
    constructor(emailService, intervalMs = 2000) {
        this.queue = [];
        this.emailService = emailService;
        this.intervalMs = intervalMs;
        this.isRunning = false;
    }

    add(email) {
        const hash = this._generateHash(email);
        console.log(`Adding email to queue: ${hash}`);
        this.queue.push(email);
        this.start();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        this.timer = setInterval(async () => {
            if (this.queue.length === 0) {
                clearInterval(this.timer);
                this.isRunning = false;
                return;
            }

            const email = this.queue.shift();
            const hash = this._generateHash(email);

            try {
                const result = await this.emailService.send(email);
                console.log(`Email processed: ${hash} → ${result}`);
            } catch (error) {
                console.error(`Failed to send email: ${hash}, Error: ${error.message}`);
                this.queue.unshift(email);
            }
        }, this.intervalMs);
    }

    _generateHash(email) {
        const raw = `${email.to}::${email.subject}::${email.body}`;
        return crypto.createHash('sha256').update(raw).digest('hex');
    }
}

module.exports = EmailQueue;
