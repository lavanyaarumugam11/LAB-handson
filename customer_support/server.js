const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static UI from public/
app.use(express.static(path.join(__dirname, 'public')));

// Simple health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Example message endpoint: this is a placeholder for integrating real NLP or tools
app.post('/api/message', (req, res) => {
  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Missing `message` in request body.' });
  }

  // Very simple canned logic for demo purposes
  const lower = message.toLowerCase();
  let reply = "Thanks for your message. A support agent will follow up shortly.";
  if (lower.includes('refund') || lower.includes('charged') || lower.includes('billing')) {
    reply = "I can help with billing — please provide your booking ID or the last 4 digits of the card used. For privacy, do not post full card numbers here.";
  } else if (lower.includes('wifi') || lower.includes('disconnect') || lower.includes('connection')) {
    reply = "Sorry you're seeing connectivity issues — can you confirm whether this is for a single device or multiple devices?";
  }

  // Example response includes a confidence and suggested next steps
  const response = {
    reply,
    confidence: 0.8,
    next_steps: [
      "If this is billing-related, provide booking ID (masked) or request a callback.",
      "If this is technical, provide device, OS, and screenshots/logs if available."
    ]
  };

  res.json(response);
});

// Fallback to index.html for single-page usage
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Customer Support demo running at http://localhost:${PORT}`);
});
