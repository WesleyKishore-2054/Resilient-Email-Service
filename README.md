# Resilient Email Sending Service

A Node.js project simulating a reliable email system with retry logic, fallback, rate limiting, idempotency, and circuit breaker patterns using **mock providers**.

---

## Project Structure

```
src/
├── index.js                # Entry point (Express API)
├── services/
│   └── EmailService.js     # Core logic for sending emails
├── providers/
│   ├── ProviderA.js        # Mock Email Provider A
│   └── ProviderB.js        # Mock Email Provider B
├── utils/
│   ├── retryWithBackoff.js # Retry with exponential backoff
│   ├── RateLimiter.js      # Rate limiting logic
│   ├── CircuitBreaker.js   # Circuit breaker logic
│   └── EmailQueue.js       # Simple queue system
└── tests/
    └── EmailService.test.js # Jest test cases
```

---

## Setup Instructions

1. **Clone the Repository**  
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

2. **Install Dependencies**  
```bash
npm install
```

3. **Run the Service**  
```bash
node src/index.js
```

4. **Send Email via cURL or Postman**  
```bash
curl -X POST http://localhost:3000/send   -H "Content-Type: application/json"   -d '{
    "from": "wesley@gmail.com",
    "to": "user1@example.com",
    "subject": "Hello",
    "body": "Testing"
}'
```

5. **Check Email Status**  
```bash
curl http://localhost:3000/status/{HASHED-KEY_ID}
```

---

##  Features Implemented

-  Two mock providers (`ProviderA`, `ProviderB`)
-  Retry with exponential backoff (up to 3 attempts)
-  Fallback to next provider on failure
-  Circuit breaker for each provider
-  Idempotency using hashed content or provided ID
-  Rate limiting (e.g. 10 emails per 60 seconds)
-  Email queue to process messages sequentially
-  Status tracking via `/status/:emailId`
-  Logging to console for visibility
-  Jest tests for corner cases and flows

---

## Assumptions & Notes

- Providers are mocked with simulated success/failure using `Math.random()`.
- To ensure consistent testing, the randomness can be toggled off by hardcoding `const success = true` in providers.
- No real emails are sent.
- No external libraries used for email, queue, or circuit breaker.
- The app is built using plain JavaScript (not TypeScript).

---

## Testing

Run all test cases using Jest:

```bash
npm test
```

---

## Deployment (Render)

This project is deployed using **Render**, a cloud platform for hosting web services.

### Setup Instructions for Deployment:

1. **Push Code to GitHub**
   - Make sure your project is committed and pushed to a GitHub repository.

2. **Sign Up / Log In to Render**
   - Visit [https://render.com](https://render.com) and sign in using GitHub.

3. **Create a New Web Service**
   - Click on **New +** → **Web Service**.
   - Connect your GitHub repository.
   - Choose the correct repository containing this project.

4. **Configure Service**
   - **Name**: Resilient-Email-Service
   - **Branch**: main
   - **Runtime Environment**: Node
   - **Root Directory**: (leave blank unless your project is inside a subfolder)
   - **Build Command**:
     ```
     npm install
     ```
   - **Start Command**:
     ```
     node src/index.js
     ```

5. **Free Plan Selection**
   - Choose the **Free** instance type if you're testing or demonstrating.

6. **Deploy**
   - Click **Create Web Service** to trigger the build and deploy process.
   - Once deployed, Render will show a public URL like:
     ```
     https://resilient-email-service-xxxxx.onrender.com
     ```

### Note:

- Ensure `PORT` is dynamically picked in `index.js`:
  ```js
  const PORT = process.env.PORT || 3000;
