const OpenAI = require('openai');
const crypto = require('crypto');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Simple in-memory rate limiting for Vercel (since it's stateless)
const rateLimitMap = new Map();

function checkRateLimit(clientId) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;
  
  if (!rateLimitMap.has(clientId)) {
    rateLimitMap.set(clientId, []);
  }
  
  const requests = rateLimitMap.get(clientId);
  const validRequests = requests.filter(time => time > now - windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitMap.set(clientId, validRequests);
  
  // Clean up old entries
  if (rateLimitMap.size > 1000) {
    const cutoff = now - windowMs;
    for (const [key, times] of rateLimitMap.entries()) {
      const validTimes = times.filter(time => time > cutoff);
      if (validTimes.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, validTimes);
      }
    }
  }
  
  return true;
}

function detectSuspiciousContent(message) {
  const suspiciousKeywords = ['hack', 'exploit', 'attack', 'bypass', 'injection'];
  const lowerMessage = message.toLowerCase();
  
  return suspiciousKeywords.some(keyword => lowerMessage.includes(keyword));
}

module.exports = async (req, res) => {
  const startTime = Date.now();
  const clientId = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  
  // Enable CORS with security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      hint: 'Only POST requests are accepted'
    });
  }

  try {
    // Rate limiting check
    if (!checkRateLimit(clientId)) {
      console.warn('Rate limit exceeded for client:', clientId);
      return res.status(429).json({ 
        error: 'Too many requests. Please slow down and try again in a minute.',
        retryAfter: 60
      });
    }

    const { message } = req.body;
    
    // Enhanced validation
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ 
        error: 'A valid message is required',
        hint: 'Please provide a non-empty text message'
      });
    }

    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length > 2000) {
      return res.status(400).json({ 
        error: 'Message is too long',
        hint: 'Please keep your message under 2000 characters',
        currentLength: trimmedMessage.length,
        maxLength: 2000
      });
    }

    // Check for suspicious content
    if (detectSuspiciousContent(trimmedMessage)) {
      console.warn('Suspicious content detected:', {
        clientId,
        messagePreview: trimmedMessage.substring(0, 100)
      });
      return res.status(400).json({
        error: 'Your message contains content that cannot be processed.',
        hint: 'Please rephrase your question and focus on development topics.'
      });
    }

    console.log('Processing chat request:', {
      clientId,
      messageLength: trimmedMessage.length,
      timestamp: new Date().toISOString()
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

    console.log('Chat request successful:', {
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

    console.error('Chat request failed:', {
      clientId,
      duration,
      errorType,
      errorCode: err.code,
      errorMessage: err.message
    });

    res.status(statusCode).json({ 
      error: userMessage,
      errorId: crypto.randomUUID(), // Secure error ID for support
      supportEmail: 'support@autodevelop.ai'
    });
  }
};
