Customer Support (local demo)

This is a minimal Node.js Express demo that serves a simple static chat UI and a sample `/api/message` endpoint. It's intended to run locally for development or testing.

Requirements
- Node.js (>=14)

Quick start (PowerShell)

```powershell
cd "c:\Users\hp\Downloads\hotelBookingSystem\hotelBookingSystem\Customer support"
npm install
npm start
# Open http://localhost:3000 in your browser
```

Notes
- The `/api/message` endpoint is a placeholder: it returns canned replies and includes a `confidence` field and `next_steps` array. Replace or extend it to integrate with your real backend, databases, or NLP tools.
- Keep sensitive operations (refunds, account changes) off this demo server; implement secure authentication and audit logging before production.
