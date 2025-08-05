const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/message', (req, res) => {
  const prompt = (req.body && req.body.prompt) || '';
  const reply = prompt ? `Echo: ${prompt}` : 'Hello from the mock API.';
  res.json({ reply });
});

app.listen(PORT, () => console.log(`Mock API listening on http://localhost:${PORT}`));
