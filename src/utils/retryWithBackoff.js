async function retryWithBackoff(fn, retries = 3, delay = 500) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`[RETRY] Attempt ${i + 1}`);
            return await fn();
        } catch (error) {
            if (i < retries - 1) {
                const wait = delay * Math.pow(2, i);
                console.log(`[RETRY] Failed attempt ${i + 1}, retrying in ${wait}ms...`);
                await new Promise(resolve => setTimeout(resolve, wait));
            } else {
                console.log(`[RETRY] All ${retries} attempts failed.`);
                throw error;
            }
        }
    }
}

module.exports = retryWithBackoff;
