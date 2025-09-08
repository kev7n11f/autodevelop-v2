// Simple Vercel serverless function for AutoDevelop.ai
// This handles API requests and serves the chat functionality

// Load environment variables
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();

// Basic middleware
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: true, // Allow all origins for testing
  credentials: true
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: {
      nodeEnv: process.env.NODE_ENV || 'production',
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSendGrid: !!process.env.SENDGRID_API_KEY,
      hasStripe: !!process.env.STRIPE_SECRET_KEY
    }
  });
});

// Chat endpoint - direct implementation
app.post('/api/chat', async (req, res) => {
  try {
    const OpenAI = require('openai');
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'OpenAI API not configured',
        message: 'Chat functionality requires OpenAI API key'
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant for AutoDevelop.ai. Help users transform their ideas into reality with practical, step-by-step guidance. Be professional, clear, and well-structured."
        },
        {
          role: "user",
          content: message.trim()
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
    
    res.json({
      reply,
      meta: {
        timestamp: new Date().toISOString(),
        model: "gpt-3.5-turbo"
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Chat service error',
      message: 'Unable to process your request. Please try again.'
    });
  }
});

// Export for Vercel
module.exports = app;
