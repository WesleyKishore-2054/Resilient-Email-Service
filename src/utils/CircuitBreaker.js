class CircuitBreaker{
    constructor(failureThreshold, recoveryTimeout) {
        this.failureThreshold = failureThreshold;
        this.recoveryTimeout = recoveryTimeout;
        this.failureCount = 0;
        this.state = 'CLOSED'; 
        this.lastFailureTime = null;
    }

    canRequest(){
        if(this.state==='OPEN'){
            const now=Date.now();
            if(now - this.lastFailureTime > this.recoveryTimeout) {
                this.state = 'HALF_OPEN'; // we can request for half the allowed attempts, if the allowed attempts is 4 ,we can try 2 attempts
                return true; 
            }
            return false;
        }
        return true;
    }

    recordSuccess() {
       this.failureCount=0;
         this.state = 'CLOSED';
    }

    //this will be called when a request fails or runs out of attempts
    //if the failure count reaches the threshold, the circuit breaker will open
    recordFailure() {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            this.lastFailureTime = Date.now();
        }
    }

}
module.exports = CircuitBreaker;