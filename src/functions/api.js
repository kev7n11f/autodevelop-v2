const dynamodb = require('../utils/dynamodb');
const jwtService = require('../utils/jwt');
const { authenticateToken, rateLimit } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');
const logger = require('../../backend/utils/logger');

// Helper to create lambda response
const createResponse = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    ...headers
  },
  body: JSON.stringify(body)
});

// Convert Express-style middleware to work with Lambda
const runMiddleware = async (req, res, middleware) => {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Mock Express request/response objects for Lambda
const createMockExpressObjects = (event) => {
  const req = {
    headers: event.headers || {},
    cookies: {}, // In real implementation, parse cookies from headers
    user: null,
    body: event.body ? JSON.parse(event.body) : {},
    params: event.pathParameters || {},
    query: event.queryStringParameters || {},
    ip: event.requestContext?.identity?.sourceIp || 'unknown'
  };

  let response = null;
  const res = {
    status: (code) => {
      response = { statusCode: code };
      return res;
    },
    json: (data) => {
      response = { ...response, body: data };
      return res;
    },
    set: (headers) => {
      response = { ...response, headers: { ...response?.headers, ...headers } };
      return res;
    }
  };

  return { req, res, getResponse: () => response };
};

// Health check endpoint
const health = async (event) => {
  try {
    // Check database connectivity
    const dbHealth = await dynamodb.healthCheck();

    return createResponse(200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0-serverless',
      environment: {
        nodeEnv: process.env.NODE_ENV || 'production',
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasStripe: !!process.env.STRIPE_SECRET_KEY,
        stage: process.env.STAGE || 'dev'
      },
      services: {
        database: dbHealth.healthy ? 'healthy' : 'unhealthy',
        databaseType: dbHealth.database
      }
    });

  } catch (error) {
    logger.error('Health check error:', error);
    return createResponse(503, {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

// Chat endpoint
const chat = async (event) => {
  try {
    // Authenticate user
    const { req, res } = createMockExpressObjects(event);
    
    try {
      await runMiddleware(req, res, authenticateToken);
    } catch (authError) {
      return createResponse(401, {
        success: false,
        error: 'Authentication required',
        details: authError.message
      });
    }

    if (!req.user) {
      return createResponse(401, {
        success: false,
        error: 'Authentication required'
      });
    }

    // Validate input
    const body = JSON.parse(event.body || '{}');
    const { error, value } = schemas.chatMessage.validate(body);
    if (error) {
      return createResponse(400, {
        success: false,
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const { message } = value;

    // Check if user has active subscription for unlimited messages
    const subscription = await dynamodb.getSubscription(req.user.id);
    const hasActiveSubscription = subscription && subscription.status === 'active';

    // Rate limiting for free users
    if (!hasActiveSubscription) {
      try {
        await runMiddleware(req, res, rateLimit(15 * 60 * 1000, 10)); // 10 requests per 15 minutes for free users
      } catch (rateLimitError) {
        return createResponse(429, {
          success: false,
          error: 'Rate limit exceeded',
          details: 'Free users are limited to 10 messages per 15 minutes. Upgrade to Pro for unlimited access.'
        });
      }
    }

    // Call OpenAI API
    if (!process.env.OPENAI_API_KEY) {
      return createResponse(503, {
        success: false,
        error: 'OpenAI API not configured',
        message: 'Chat functionality requires OpenAI API key'
      });
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an enthusiastic and supportive AI development assistant for AutoDevelop.ai, a software development and coding platform. Your mission is to help users build amazing software applications, websites, and digital projects.\n\n🎯 **Your Role:**\n- Help with software development, programming, web development, app building, and coding projects\n- Provide step-by-step guidance for building applications, websites, and digital solutions\n- Offer encouragement and celebrate user progress\n- Share coding best practices, frameworks, and development strategies\n- Assist with frontend, backend, databases, deployment, and full-stack development\n\n✨ **Your Personality:**\n- Be genuinely excited about helping users build their ideas into reality\n- Use encouraging language like \"That's a fantastic idea!\" \"You're on the right track!\" \"Great question!\"\n- Acknowledge the user's skills and potential\n- Be patient and supportive, especially with beginners\n- Celebrate wins and progress, no matter how small\n\n📝 **Response Format:**\n- Use ## Headers for main topics\n- **Bold text** for important concepts\n- Numbered lists (1. 2. 3.) for step-by-step instructions\n- Bullet points (- or *) for features, options, or tips\n- `code snippets` for technical terms and short code\n- ```code blocks``` for longer code examples\n- Include relevant emojis to make responses more engaging\n\n🎯 **CRITICAL - Always End with Suggestions:**\nAfter providing your main response, ALWAYS conclude with a \"**🚀 What's Next?**\" or \"**💡 Suggested Next Steps:**\" section that offers 2-3 specific, actionable suggestions related to their question. Examples:\n- Ask clarifying questions to help them further\n- Suggest related topics they might want to explore\n- Recommend specific tools, frameworks, or resources\n- Propose logical next steps in their development journey\n- Offer to help with implementation details\n\nMake these suggestions practical and encouraging, showing them clear paths forward!\n\n🚫 **Important:** You help with SOFTWARE development only - programming, coding, web development, app building, databases, APIs, etc. If asked about automotive, manufacturing, or unrelated topics, politely redirect to software development topics.\n\nBe professional yet warm, clear yet encouraging, and always focus on empowering users to build incredible software!"
        },
        {
          role: "user",
          content: message.trim()
        }
      ],
      max_tokens: 700,
      temperature: 0.7
    });

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
    
    logger.info('Chat request processed', { 
      userId: req.user.id, 
      hasSubscription: hasActiveSubscription,
      messageLength: message.length 
    });

    return createResponse(200, {
      success: true,
      reply,
      meta: {
        timestamp: new Date().toISOString(),
        model: "gpt-3.5-turbo",
        userId: req.user.id,
        hasSubscription: hasActiveSubscription
      }
    });

  } catch (error) {
    logger.error('Chat error:', error);
    return createResponse(500, {
      success: false,
      error: 'Chat service error',
      message: 'Unable to process your request. Please try again.'
    });
  }
};

// Chat suggestions endpoint
const chatSuggestions = async (event) => {
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

  return createResponse(200, {
    success: true,
    suggestions,
    meta: {
      timestamp: new Date().toISOString(),
      totalCategories: suggestions.length,
      totalQuestions: suggestions.reduce((sum, cat) => sum + cat.questions.length, 0)
    }
  });
};

// User profile endpoint
const profile = async (event) => {
  try {
    const { req, res } = createMockExpressObjects(event);
    
    try {
      await runMiddleware(req, res, authenticateToken);
    } catch (authError) {
      return createResponse(401, {
        success: false,
        error: 'Authentication required'
      });
    }

    const user = req.user;
    const subscription = await dynamodb.getSubscription(user.id);

    return createResponse(200, {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      subscription: subscription ? {
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
      } : null
    });

  } catch (error) {
    logger.error('Profile error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to get profile',
      details: error.message
    });
  }
};

// Main handler
exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {}, {
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });
  }

  const path = event.path || event.pathParameters?.proxy || '';
  const method = event.httpMethod;

  try {
    // Route requests
    if (method === 'GET' && path.endsWith('/health')) {
      return await health(event);
    } else if (method === 'POST' && path.endsWith('/chat')) {
      return await chat(event);
    } else if (method === 'GET' && path.includes('/chat/suggestions')) {
      return await chatSuggestions(event);
    } else if (method === 'GET' && path.endsWith('/profile')) {
      return await profile(event);
    }

    return createResponse(404, {
      success: false,
      error: 'Endpoint not found',
      path,
      method
    });

  } catch (error) {
    logger.error('API handler error:', error);
    return createResponse(500, {
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};