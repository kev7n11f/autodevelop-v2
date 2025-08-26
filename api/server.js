require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));
app.use(express.json());
app.use('/api', apiRoutes);

app.get('/', (_, res) => res.json({ 
  status: 'healthy',
  message: 'AutoDevelop.ai API server running ✅',
  timestamp: new Date().toISOString()
}));

app.listen(port, () => console.log(`🌐  API Server listening on port ${port}`));
