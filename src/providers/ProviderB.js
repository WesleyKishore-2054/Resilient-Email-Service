class ProviderB {
    constructor()
    {
        this.name="ProviderB";
    }
    async send(email) {
        const success=(Math.random())  > 0.7; 
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
module.exports = ProviderB;