class ProviderA {
    constructor()
    {
        this.name="ProviderA";
    }
    async send(email) {
        const success=Math.random() >= 0.6; 
        return new Promise((resolve, reject)=>{
            setTimeout(() => {
                if (success) {
                    resolve(`Email sent successfully by ${this.name}`);
                } else {
                    reject(new Error(`Failed to send email by ${this.name}`));
                }
            },200);
        });
    }
}
module.exports = ProviderA; 