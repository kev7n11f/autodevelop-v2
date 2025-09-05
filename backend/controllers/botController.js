const OpenAI = require('openai');
const logger = require('../utils/logger');
const { abuseDetection, chatRateLimit } = require('../middleware/security');
const database = require('../utils/database');
const FREE_LIMIT = parseInt(process.env.FREE_MESSAGE_LIMIT || '5', 10);
const FREE_MONTHLY_LIMIT = parseInt(process.env.FREE_MONTHLY_LIMIT || '150', 10);

// in-memory usage delta cache (batch flush)
const usageDeltaCache = new Map(); // userId -> { daily: n, monthly: n }
let lastFlush = Date.now();
const FLUSH_INTERVAL_MS = parseInt(process.env.USAGE_FLUSH_INTERVAL_MS || '30000', 10);
const MAX_CACHE_SIZE = parseInt(process.env.USAGE_CACHE_MAX || '500', 10);

async function flushUsageDeltas(force = false) {
  const now = Date.now();
  if (!force && now - lastFlush < FLUSH_INTERVAL_MS && usageDeltaCache.size < MAX_CACHE_SIZE) return;
  const deltas = [];
  usageDeltaCache.forEach((v, k) => {
    if (v.daily > 0 || v.monthly > 0) deltas.push({ userId: k, dailyDelta: v.daily, monthlyDelta: v.monthly });
  });
  if (!deltas.length) return;
  try {
    await database.applyUsageDeltas(deltas);
    deltas.forEach(d => usageDeltaCache.delete(d.userId));
    lastFlush = now;
    logger.debug('Flushed usage deltas', { count: deltas.length });
  } catch (e) {
    logger.error('Failed to flush usage deltas', { error: e.message });
  }
}

setInterval(() => flushUsageDeltas().catch(()=>{}), FLUSH_INTERVAL_MS).unref();
process.on('beforeExit', () => flushUsageDeltas(true));

function addUsageDelta(userId) {
  const rec = usageDeltaCache.get(userId) || { daily: 0, monthly: 0 };
  rec.daily += 1; rec.monthly += 1;
  usageDeltaCache.set(userId, rec);
  if (usageDeltaCache.size >= MAX_CACHE_SIZE) flushUsageDeltas().catch(()=>{});
}

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
    
    if (!openai) {
      logger.error('OpenAI client not available', { clientId });
      return res.status(503).json({
        error: 'AI chat service not configured',
        message: 'The AI chat feature requires an OpenAI API key to be configured.',
        details: {
          reason: 'Missing OPENAI_API_KEY environment variable',
          solution: 'Add your OpenAI API key to the .env file',
          documentation: 'See GETTING_STARTED.md for setup instructions',
          note: 'The chat framework is working - it just needs an API key'
        },
        supportEmail: 'support@autodevelop.ai'
      });
    }
    
    try {
      const { message } = req.body;
      const userId = req.body.userId || clientId; // fallback to IP
      const deviceId = req.headers['x-device-id'];

      // Basic fraud safeguard: if userId differs across many IPs quickly (placeholder) - could implement in DB/audit
      // (Future: track in Redis / memory; here we only log.)

      let subscription = null;
      try { subscription = await database.getPaymentSubscription(userId); } catch (e) { logger.warn('Subscription lookup failed', { userId, error: e.message }); }
      const isSubscribed = subscription && ['active', 'trial'].includes(subscription.status);

      // Load usage (ensure periodic boundary resets happen implicitly in DB logic when we increment) 
      let usage = await database.getUserUsage(userId);
      if (!usage) {
        // create baseline by increment (will set counts)
        await database.incrementUserUsage(userId); // ensures row
        usage = await database.getUserUsage(userId);
      }

      if (!isSubscribed) {
        const dailyUsed = usage ? usage.message_count : 0;
        const monthlyUsed = usage ? usage.monthly_message_count : 0;
        
        // Add pending deltas from memory cache to get accurate current usage
        const pendingDeltas = usageDeltaCache.get(userId) || { daily: 0, monthly: 0 };
        const currentDailyUsed = dailyUsed + pendingDeltas.daily;
        const currentMonthlyUsed = monthlyUsed + pendingDeltas.monthly;
        
        if (currentDailyUsed >= FREE_LIMIT || currentMonthlyUsed >= FREE_MONTHLY_LIMIT) {
          await database.logUsageEvent({ userId, eventType: 'limit_block', dailyCount: currentDailyUsed, monthlyCount: currentMonthlyUsed, ip: clientId, source: 'chat' });
          return res.status(402).json({
            error: 'Free limit reached',
            remaining: 0,
            upgrade: true,
            message: `You have reached the free ${currentDailyUsed >= FREE_LIMIT ? 'daily' : 'monthly'} limit (${FREE_LIMIT}/day, ${FREE_MONTHLY_LIMIT}/month). Please upgrade to continue.`,
            checkoutEndpoint: '/api/payments/stripe/checkout'
          });
        }
        // Use batched increment (memory) instead of immediate DB write
        addUsageDelta(userId);
      }

      if (!message || typeof message !== 'string' || !message.trim()) {
        logger.warn('Invalid message received', { clientId, messageType: typeof message, messageLength: message ? message.length : 0 });
        return res.status(400).json({ error: 'A valid message is required', hint: 'Please provide a non-empty text message' });
      }

      const trimmedMessage = message.trim();
      if (trimmedMessage.length > 2000) {
        logger.warn('Message too long', { clientId, messageLength: trimmedMessage.length });
        return res.status(400).json({ error: 'Message is too long', hint: 'Please keep your message under 2000 characters', currentLength: trimmedMessage.length, maxLength: 2000 });
      }

      logger.info('Processing chat request', { clientId, userId, messageLength: trimmedMessage.length, messagePreview: trimmedMessage.substring(0, 100) });

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful AI assistant for AutoDevelop.ai. Help users transform their ideas into reality with practical, step-by-step guidance. \n\nFormat your responses using:\n- ## Headers for main topics\n- **Bold text** for important points\n- Numbered lists (1. 2. 3.) for sequential steps\n- Bullet points (- or *) for features or options\n- `code snippets` for technical terms\n- ```code blocks``` for longer code examples\n\nBe professional, clear, and well-structured. If asked about anything inappropriate or harmful, politely decline and redirect to constructive development topics." },
          { role: "user", content: trimmedMessage }
        ],
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
      const duration = Date.now() - startTime;

      // After successful generation flush deltas maybe (soft heuristic)
      flushUsageDeltas();

      if (!isSubscribed) {
        const updatedUsage = await database.getUserUsage(userId); // may lag until flush; still okay
        await database.logUsageEvent({ userId, eventType: 'message_used', delta: 1, dailyCount: updatedUsage?.message_count, monthlyCount: updatedUsage?.monthly_message_count, ip: clientId, source: 'chat', meta: { deviceId } });
      }

      res.json({ 
        reply,
        meta: {
          timestamp: new Date().toISOString(),
          responseTime: duration,
          freeDailyLimit: FREE_LIMIT,
          freeMonthlyLimit: FREE_MONTHLY_LIMIT,
          subscribed: isSubscribed,
          // approximate remaining (prefetch updated usage again for accuracy after flush maybe)
          remainingDailyFree: isSubscribed ? null : Math.max(0, FREE_LIMIT - (usage?.message_count || 0) - (usageDeltaCache.get(userId)?.daily || 0)),
          remainingMonthlyFree: isSubscribed ? null : Math.max(0, FREE_MONTHLY_LIMIT - (usage?.monthly_message_count || 0) - (usageDeltaCache.get(userId)?.monthly || 0))
        }
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      let errorType = 'unknown';
      let userMessage = 'Sorry, I encountered an error. Please try again.';
      let statusCode = 500;
      if (err.code === 'insufficient_quota') { errorType = 'quota_exceeded'; userMessage = 'Our AI service is temporarily unavailable due to high demand. Please try again in a few minutes.'; statusCode = 503; }
      else if (err.code === 'rate_limit_exceeded') { errorType = 'openai_rate_limit'; userMessage = 'Too many requests to our AI service. Please wait a moment and try again.'; statusCode = 429; }
      else if (err.code === 'invalid_request_error') { errorType = 'invalid_request'; userMessage = 'There was an issue with your request. Please try rephrasing your message.'; statusCode = 400; }
      else if (err.code === 'context_length_exceeded') { errorType = 'message_too_long'; userMessage = 'Your message is too complex. Please try breaking it into smaller, simpler questions.'; statusCode = 400; }
      else if (err.code === 'content_filter') { errorType = 'content_filtered'; userMessage = 'Your message contains content that cannot be processed. Please rephrase your question.'; statusCode = 400; }
      logger.error('Chat request failed', { clientId, duration, errorType, errorCode: err.code, errorMessage: err.message, stack: err.stack });
      res.status(statusCode).json({ error: userMessage, supportEmail: 'support@autodevelop.ai' });
    }
  }
];
