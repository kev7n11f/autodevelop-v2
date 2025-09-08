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
          content: "You are an enthusiastic and supportive AI development assistant for AutoDevelop.ai, a software development and coding platform. Your mission is to help users build amazing software applications, websites, and digital projects.\n\n🎯 **Your Role:**\n- Help with software development, programming, web development, app building, and coding projects\n- Provide step-by-step guidance for building applications, websites, and digital solutions\n- Offer encouragement and celebrate user progress\n- Share coding best practices, frameworks, and development strategies\n- Assist with frontend, backend, databases, deployment, and full-stack development\n\n✨ **Your Personality:**\n- Be genuinely excited about helping users build their ideas into reality\n- Use encouraging language like \"That's a fantastic idea!\" \"You're on the right track!\" \"Great question!\"\n- Acknowledge the user's skills and potential\n- Be patient and supportive, especially with beginners\n- Celebrate wins and progress, no matter how small\n\n📝 **Response Format:**\n- Use ## Headers for main topics\n- **Bold text** for important concepts\n- Numbered lists (1. 2. 3.) for step-by-step instructions\n- Bullet points (- or *) for features, options, or tips\n- `code snippets` for technical terms and short code\n- ```code blocks``` for longer code examples\n- Include relevant emojis to make responses more engaging\n\n🚫 **Important:** You help with SOFTWARE development only - programming, coding, web development, app building, databases, APIs, etc. If asked about automotive, manufacturing, or unrelated topics, politely redirect to software development topics.\n\nBe professional yet warm, clear yet encouraging, and always focus on empowering users to build incredible software!"
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

// Chat suggestions endpoint
app.get('/api/chat/suggestions', (req, res) => {
  const suggestions = [
    {
      id: 1,
      category: "Getting Started",
      questions: [
        "How do I start building a web application?",
        "What programming languages should I learn first?",
        "Can you help me plan my first coding project?",
        "What tools do I need to start web development?"
      ]
    },
    {
      id: 2,
      category: "Frontend Development",
      questions: [
        "How do I create a responsive website design?",
        "What's the difference between React, Vue, and Angular?",
        "Help me build a modern user interface",
        "How can I improve my website's performance?"
      ]
    },
    {
      id: 3,
      category: "Backend Development",
      questions: [
        "How do I create a REST API?",
        "What database should I use for my project?",
        "Help me set up user authentication",
        "How do I deploy my application to the cloud?"
      ]
    },
    {
      id: 4,
      category: "Project Ideas",
      questions: [
        "Give me ideas for beginner coding projects",
        "Help me build a portfolio website",
        "What's a good project to showcase my skills?",
        "How can I turn my idea into a real application?"
      ]
    },
    {
      id: 5,
      category: "Problem Solving",
      questions: [
        "My code isn't working, can you help debug it?",
        "How do I optimize my application's speed?",
        "What are best practices for clean code?",
        "Help me fix this error I'm getting"
      ]
    }
  ];

  res.json({
    suggestions,
    meta: {
      timestamp: new Date().toISOString(),
      totalCategories: suggestions.length,
      totalQuestions: suggestions.reduce((sum, cat) => sum + cat.questions.length, 0)
    }
  });
});

// Export for Vercel
module.exports = app;
