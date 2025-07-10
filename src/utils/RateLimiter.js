class RateLimiter{
    constructor(limit,intervalMs) { //10,60000ms
        this.limit=limit;
        this.interval=intervalMs;
        this.timestamps = [];
    }
    allow() { //this is a sliding window rate limiter
        const now = Date.now();
        this.timestamps = this.timestamps.filter(timestamp => now - timestamp < this.interval);
        if (this.timestamps.length < this.limit) {
            this.timestamps.push(now);
            return true;
        }
        return false;
    }
}
module.exports = RateLimiter;