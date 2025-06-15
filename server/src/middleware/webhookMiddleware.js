const crypto = require('crypto');

/**
 * Middleware to verify Paystack webhook signatures
 * This ensures that webhooks are actually coming from Paystack
 */
const verifyPaystackWebhook = (req, res, next) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    
    if (!signature) {
      return res.status(401).json({
        success: false,
        message: 'No signature provided'
      });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!secretKey) {
      console.error('PAYSTACK_SECRET_KEY not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Create hash of the request body
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(JSON.stringify(req.body))
      .digest('hex');

    // Verify signature
    if (hash !== signature) {
      console.log('Webhook signature verification failed');
      console.log('Expected:', hash);
      console.log('Received:', signature);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Signature is valid, proceed to the next middleware
    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Webhook verification failed'
    });
  }
};

/**
 * Middleware to parse raw body for webhook verification
 * This is needed because crypto.createHmac needs the raw body, not parsed JSON
 */
const rawBodyParser = (req, res, next) => {
  let rawBody = '';
  
  req.on('data', (chunk) => {
    rawBody += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      req.body = JSON.parse(rawBody);
      req.rawBody = rawBody;
      next();
    } catch (error) {
      console.error('Error parsing webhook body:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON body'
      });
    }
  });
};

/**
 * Enhanced webhook verification that uses raw body
 */
const verifyPaystackWebhookWithRawBody = (req, res, next) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    
    if (!signature) {
      return res.status(401).json({
        success: false,
        message: 'No signature provided'
      });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!secretKey) {
      console.error('PAYSTACK_SECRET_KEY not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Use raw body for hash calculation
    const bodyToHash = req.rawBody || JSON.stringify(req.body);
    
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(bodyToHash)
      .digest('hex');

    if (hash !== signature) {
      console.log('Webhook signature verification failed');
      console.log('Body length:', bodyToHash.length);
      console.log('Expected:', hash);
      console.log('Received:', signature);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    console.log('Webhook signature verified successfully');
    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Webhook verification failed'
    });
  }
};

/**
 * Middleware to log webhook events for debugging
 */
const logWebhookEvent = (req, res, next) => {
  const event = req.body;
  
  console.log('=== Webhook Event Received ===');
  console.log('Event Type:', event.event);
  console.log('Event ID:', event.data?.id);
  console.log('Reference:', event.data?.reference);
  console.log('Status:', event.data?.status);
  console.log('Amount:', event.data?.amount);
  console.log('Timestamp:', new Date().toISOString());
  console.log('==============================');
  
  next();
};

/**
 * Middleware to validate webhook event structure
 */
const validateWebhookEvent = (req, res, next) => {
  const event = req.body;
  
  if (!event.event || !event.data) {
    return res.status(400).json({
      success: false,
      message: 'Invalid webhook event structure'
    });
  }
  
  // List of supported events
  const supportedEvents = [
    'charge.success',
    'charge.dispute.create',
    'charge.dispute.remind',
    'charge.dispute.resolve',
    'transfer.success',
    'transfer.failed',
    'transfer.reversed'
  ];
  
  if (!supportedEvents.includes(event.event)) {
    console.log(`Unsupported webhook event: ${event.event}`);
    // Return 200 to acknowledge receipt even for unsupported events
    return res.status(200).json({
      success: true,
      message: 'Event acknowledged but not processed'
    });
  }
  
  next();
};

/**
 * Middleware to handle webhook timeouts and retries
 */
const webhookTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error('Webhook processing timeout');
        res.status(408).json({
          success: false,
          message: 'Webhook processing timeout'
        });
      }
    }, timeoutMs);
    
    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeout);
    });
    
    next();
  };
};

/**
 * Rate limiting for webhooks (prevent spam)
 */
const webhookRateLimit = () => {
  const attempts = new Map();
  const RATE_LIMIT = 10; // Max 10 webhooks per minute per IP
  const WINDOW_MS = 60 * 1000; // 1 minute
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!attempts.has(ip)) {
      attempts.set(ip, []);
    }
    
    const ipAttempts = attempts.get(ip);
    
    // Remove old attempts outside the window
    const validAttempts = ipAttempts.filter(time => now - time < WINDOW_MS);
    
    if (validAttempts.length >= RATE_LIMIT) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded'
      });
    }
    
    validAttempts.push(now);
    attempts.set(ip, validAttempts);
    
    next();
  };
};

module.exports = {
  verifyPaystackWebhook,
  rawBodyParser,
  verifyPaystackWebhookWithRawBody,
  logWebhookEvent,
  validateWebhookEvent,
  webhookTimeout,
  webhookRateLimit
};