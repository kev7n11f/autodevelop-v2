#!/usr/bin/env bash
set -e
echo "🚀  Bootstrapping AutoDevelop.ai …"

############################################
# 0. PRE-CHECK
############################################
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install Node LTS first."; exit 1; }
command -v yarn >/dev/null 2>&1 || { echo "❌ Yarn not found. Install Yarn first."; exit 1; }

############################################
# 1. PROJECT ROOT & GIT
############################################
yarn init -y                       # generates package.json baseline
git init                           # make sure we’re in a repo

############################################
# 2. DEPENDENCIES
############################################
echo "📦  Installing backend libs…"
yarn add express cors dotenv
yarn add -D nodemon concurrently

echo "📦  Installing frontend (React + Vite)…"
# creates frontend folder with Vite template
yarn create vite frontend --template react
cd frontend
yarn                                 # install React deps
cd ..

############################################
# 3. SCRIPTS & MONOREPO COMMANDS
############################################
cat > package.json <<'EOF'
{
  "name": "autodevelop-v2",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"nodemon backend/server.js\" \"yarn --cwd frontend dev\"",
    "build": "yarn --cwd frontend build",
    "start": "node backend/server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2"
  },
  "devDependencies": {
    "concurrently": "^7.6.0",
    "nodemon": "^3.0.3"
  }
}
EOF

############################################
# 4. FOLDER STRUCTURE
############################################
mkdir -p backend/{controllers,routes}
touch backend/server.js
touch backend/controllers/botController.js
touch backend/routes/apiRoutes.js
touch .env.example
cat > .gitignore <<'EOF'
# Node
node_modules
.env
# Vite
frontend/dist
EOF

############################################
# 5. CORE FILE CONTENT
############################################
cat > backend/server.js <<'EOF'
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');

const app  = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

app.get('/', (_, res) => res.send('AutoDevelop.ai backend running ✅'));

app.listen(port, () => console.log(\`🌐  Server listening on port \${port}\`));
EOF

cat > backend/controllers/botController.js <<'EOF'
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    // 🧠 TODO: add OpenAI call here
    res.json({ reply: `Echo: ${message}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
EOF

cat > backend/routes/apiRoutes.js <<'EOF'
const router = require('express').Router();
const { chat } = require('../controllers/botController');

router.post('/chat', chat);

module.exports = router;
EOF

cat > .env.example <<'EOF'
OPENAI_API_KEY=your_openai_key_here
SENDGRID_API_KEY=your_sendgrid_key_here
RENDER_API_KEY=...
VERCEL_API_TOKEN=...
PORT=8080
EOF

############################################
# 6. FRONTEND QUICK PATCHES
############################################
cat > frontend/src/components/BotUI.jsx <<'EOF'
import { useState } from 'react';

export default function BotUI() {
  const [input, setInput] = useState('');
  const [log,   setLog]   = useState([]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setLog(prev => [...prev, { from: 'user', text: userMsg }]);

    const res  = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    });
    const data = await res.json();
    setLog(prev => [...prev, { from: 'bot', text: data.reply }]);
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <h2>AutoDevelop.ai Bot</h2>
      <div style={{ border: '1px solid #ddd', padding: 12, minHeight: 200 }}>
        {log.map((m, i) => (
          <p key={i}><strong>{m.from}:</strong> {m.text}</p>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && send()}
        placeholder="Say something…"
        style={{ width: '80%', padding: 8 }}
      />
      <button onClick={send} style={{ padding: 8, marginLeft: 4 }}>Send</button>
    </div>
  );
}
EOF

cat > frontend/src/App.jsx <<'EOF'
import BotUI from './components/BotUI';

export default function App() {
  return (
    <main>
      <BotUI />
    </main>
  );
}
EOF

############################################
# 7. ALL DONE
############################################
echo "✅  Scaffold complete."
echo "📜  Next steps:"
echo "   1) cp .env.example .env   # then add your real keys"
echo "   2) yarn dev               # start backend + frontend concurrently"
echo "   3) Open http://localhost:5173 in your browser"