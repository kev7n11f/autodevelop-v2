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

// Pricing configuration
const PRICING_TIERS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individual developers and small projects',
    priceMonthly: 9.99,
    priceYearly: 99.99,
    currency: 'USD',
    features: [
      'Up to 500 AI messages per month',
      'Standard response time',
      'Community support',
      'Basic project templates',
      'Code generation assistance'
    ],
    stripeIds: {
      monthly: 'price_1Rh6KIFqLK5Bra1AWQ9fYf0q', // Use Pro price temporarily until Starter price is fixed
      yearly: 'price_1Rh6KIFqLK5Bra1AWQ9fYf0q'
    },
    popular: false
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Ideal for professional developers and growing teams',
    priceMonthly: 19.99,
    priceYearly: 199.99,
    currency: 'USD',
    features: [
      'Unlimited AI messages',
      'Priority response time',
      'Email support',
      'Advanced project templates',
      'Code generation & refactoring',
      'API access',
      'Custom integrations',
      'Early feature access'
    ],
    stripeIds: {
      monthly: process.env.STRIPE_PRO_PRICE_ID || 'price_1Rh6KIFqLK5Bra1AWQ9fYf0q',
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_1Rh6KIFqLK5Bra1AWQ9fYf0q'
    },
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large teams and organizations with advanced needs',
    priceMonthly: 49.99,
    priceYearly: 499.99,
    currency: 'USD',
    features: [
      'Everything in Pro',
      'Priority dedicated support',
      'Custom model fine-tuning',
      'Advanced analytics & reporting',
      'SSO integration',
      'Custom deployment options',
      'SLA guarantees',
      'Training & onboarding'
    ],
    stripeIds: {
      monthly: 'price_1S3vP1FqLK5Bra1AKmY9wSoi',
      yearly: 'price_1S3vP1FqLK5Bra1AKmY9wSoi'
    },
    popular: false
  }
};

// Pricing tiers endpoint
app.get('/api/pricing/tiers', (req, res) => {
  res.json({
    success: true,
    tiers: PRICING_TIERS,
    meta: {
      timestamp: new Date().toISOString(),
      currency: 'USD'
    }
  });
});

// Get specific pricing tier
app.get('/api/pricing/tiers/:tierId', (req, res) => {
  const { tierId } = req.params;
  const tier = PRICING_TIERS[tierId];
  
  if (!tier) {
    return res.status(404).json({
      success: false,
      error: 'Pricing tier not found',
      availableTiers: Object.keys(PRICING_TIERS)
    });
  }
  
  res.json({
    success: true,
    tier,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
});

// Stripe checkout session endpoint
app.post('/api/payments/stripe/checkout-tier', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ 
        success: false,
        error: 'Stripe not configured',
        message: 'Payment processing is not available in this environment'
      });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { userId, email, name, tierId, billingCycle = 'monthly' } = req.body;
    
    // Validate required fields
    if (!userId || !email || !name) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        details: 'userId, email, and name are required' 
      });
    }

    // Get pricing tier
    const selectedTier = PRICING_TIERS[tierId];
    if (!selectedTier) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid tier',
        details: `Pricing tier '${tierId}' not found`,
        availableTiers: Object.keys(PRICING_TIERS)
      });
    }
    
    // Get Stripe price ID
    const priceId = selectedTier.stripeIds[billingCycle];
    if (!priceId) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid billing cycle',
        details: `Billing cycle '${billingCycle}' not available for tier '${tierId}'` 
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: (process.env.STRIPE_SUCCESS_URL || 'https://autodevelop-v2.vercel.app/success') + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.STRIPE_CANCEL_URL || 'https://autodevelop-v2.vercel.app/cancel',
      metadata: {
        userId,
        name,
        tierId,
        billingCycle
      },
      subscription_data: {
        metadata: {
          userId,
          name,
          tierId,
          billingCycle
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required'
    });
    
    console.log('Stripe checkout session created:', { 
      sessionId: session.id, 
      userId, 
      tierId,
      billingCycle,
      priceId 
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      tier: {
        id: selectedTier.id,
        name: selectedTier.name,
        price: billingCycle === 'yearly' ? selectedTier.priceYearly : selectedTier.priceMonthly,
        billingCycle
      }
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
});

// Simple Stripe checkout session (legacy endpoint)
app.post('/api/payments/stripe/checkout', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ 
        error: 'Stripe not configured',
        message: 'Payment processing is not available in this environment' 
      });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { userId, email, name, priceId } = req.body;
    
    if (!userId || !email || !name) {
      return res.status(400).json({ error: 'userId, email, name required' });
    }
    
    // Use default Pro plan if no price ID provided
    const finalPriceId = priceId || PRICING_TIERS.pro.stripeIds.monthly;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: finalPriceId,
          quantity: 1
        }
      ],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { userId, planType: 'pro' }
      },
      metadata: { userId },
      success_url: (process.env.STRIPE_SUCCESS_URL || 'https://autodevelop-v2.vercel.app/success') + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.STRIPE_CANCEL_URL || 'https://autodevelop-v2.vercel.app/cancel'
    });

    res.json({ url: session.url, id: session.id });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe debug endpoint to list available prices
app.get('/api/stripe/debug/prices', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ 
        error: 'Stripe not configured',
        message: 'Stripe API key not available'
      });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // List all prices
    const prices = await stripe.prices.list({
      limit: 20,
      expand: ['data.product']
    });
    
    res.json({
      success: true,
      prices: prices.data.map(price => ({
        id: price.id,
        product: {
          id: price.product.id,
          name: price.product.name,
          description: price.product.description
        },
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
        type: price.type,
        active: price.active
      })),
      meta: {
        total: prices.data.length,
        has_more: prices.has_more
      }
    });
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prices',
      details: error.message
    });
  }
});

// Export for Vercel
module.exports = app;
