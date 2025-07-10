const express = require('express');//added dependency for express to create a REST API
const EmailService = require('./services/EmailService');
const ProviderA = require('./providers/ProviderA');
const ProviderB = require('./providers/ProviderB');
const EmailQueue = require('./utils/EmailQueue');

const providerA = new ProviderA();
const providerB = new ProviderB();
const emailService = new EmailService([providerA, providerB]);
const emailQueue = new EmailQueue(emailService, 2000); 

const app = express();
app.use(express.json());

app.post('/send', (req, res) => {
    const email = req.body;
    emailQueue.add(email);// passing the email object to the queue
    res.status(202).json({ message: 'Email has been queued for sending.' });
});

app.get('/status/:emailId', (req, res) => {
    const status = emailService.statusMap.get(req.params.emailId);
    if (status)
        res.json({ id: req.params.emailId, status });
    else
        res.status(404).json({ message: 'Email status not found' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`📨 Email service running at http://localhost:${PORT}`);
});
