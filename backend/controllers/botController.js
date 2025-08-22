const OpenAI = require('openai');
const logger = require('../utils/logger');
const { abuseDetection, chatRateLimit } = require('../middleware/security');

// Initialize OpenAI with better error handling
let openai = null;
try {
  if (!process.env.OPENAI_API_KEY) {
    logger.error('OpenAI API key is missing');
    throw new Error('OpenAI API key not configured');
  }
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  logger.info('OpenAI client initialized successfully');
} catch (error) {
  logger.error('Failed to initialize OpenAI client', { error: error.message });
}

// Apply chat-specific middleware
const chatMiddleware = [chatRateLimit, abuseDetection];

exports.chat = [
  ...chatMiddleware,
  async (req, res) => {
    const startTime = Date.now();
    const clientId = req.ip || 'unknown';
    
    // Check if OpenAI is available
    if (!openai) {
      logger.error('OpenAI client not available', { clientId });
      return res.status(503).json({
        error: 'AI service is temporarily unavailable',
        message: 'The chatbot service is currently offline. Please try again later or contact support.',
        supportEmail: 'support@autodevelop.ai'
      });
    }
    
    try {
      const { message } = req.body;
      
      // Enhanced validation
      if (!message || typeof message !== 'string' || !message.trim()) {
        logger.warn('Invalid message received', { 
          clientId,
          messageType: typeof message,
          messageLength: message ? message.length : 0
        });
        return res.status(400).json({ 
          error: 'A valid message is required',
          hint: 'Please provide a non-empty text message'
        });
      }

      const trimmedMessage = message.trim();
      
      if (trimmedMessage.length > 2000) {
        logger.warn('Message too long', { 
          clientId,
          messageLength: trimmedMessage.length 
        });
        return res.status(400).json({ 
          error: 'Message is too long',
          hint: 'Please keep your message under 2000 characters',
          currentLength: trimmedMessage.length,
          maxLength: 2000
        });
      }

      logger.info('Processing chat request', {
        clientId,
        messageLength: trimmedMessage.length,
        messagePreview: trimmedMessage.substring(0, 100)
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for AutoDevelop.ai. Help users transform their ideas into reality with practical, step-by-step guidance. \n\nFormat your responses using:\n- ## Headers for main topics\n- **Bold text** for important points\n- Numbered lists (1. 2. 3.) for sequential steps\n- Bullet points (- or *) for features or options\n- `code snippets` for technical terms\n- ```code blocks``` for longer code examples\n\nBe professional, clear, and well-structured. If asked about anything inappropriate or harmful, politely decline and redirect to constructive development topics."
          },
          {
            role: "user",
            content: trimmedMessage
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try rephrasing your question.";
      const duration = Date.now() - startTime;

      logger.info('Chat request successful', {
        clientId,
        duration,
        responseLength: reply.length,
        tokensUsed: completion.usage?.total_tokens || 0
      });

      res.json({ 
        reply,
        meta: {
          timestamp: new Date().toISOString(),
          responseTime: duration
        }
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      
      // Enhanced error categorization
      let errorType = 'unknown';
      let userMessage = 'Sorry, I encountered an error. Please try again.';
      let statusCode = 500;

      if (err.code === 'insufficient_quota') {
        errorType = 'quota_exceeded';
        userMessage = 'Our AI service is temporarily unavailable due to high demand. Please try again in a few minutes.';
        statusCode = 503;
      } else if (err.code === 'rate_limit_exceeded') {
        errorType = 'openai_rate_limit';
        userMessage = 'Too many requests to our AI service. Please wait a moment and try again.';
        statusCode = 429;
      } else if (err.code === 'invalid_request_error') {
        errorType = 'invalid_request';
        userMessage = 'There was an issue with your request. Please try rephrasing your message.';
        statusCode = 400;
      } else if (err.code === 'context_length_exceeded') {
        errorType = 'message_too_long';
        userMessage = 'Your message is too complex. Please try breaking it into smaller, simpler questions.';
        statusCode = 400;
      } else if (err.code === 'content_filter') {
        errorType = 'content_filtered';
        userMessage = 'Your message contains content that cannot be processed. Please rephrase your question.';
        statusCode = 400;
      }

      logger.error('Chat request failed', {
        clientId,
        duration,
        errorType,
        errorCode: err.code,
        errorMessage: err.message,
        stack: err.stack
      });

      res.status(statusCode).json({ 
        error: userMessage,
        errorId: crypto.randomUUID(), // Secure random error ID for support
        supportEmail: 'support@autodevelop.ai'
      });
    }
  }
];
