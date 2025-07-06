const crypto = require('crypto');

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
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== signature) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Webhook verification failed'
    });
  }
};

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
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON body'
      });
    }
  });
};

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
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    const bodyToHash = req.rawBody || JSON.stringify(req.body);
    
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(bodyToHash)
      .digest('hex');

    if (hash !== signature) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Webhook verification failed'
    });
  }
};

const logWebhookEvent = (req, res, next) => {
  next();
};

const validateWebhookEvent = (req, res, next) => {
  const event = req.body;
  
  if (!event.event || !event.data) {
    return res.status(400).json({
      success: false,
      message: 'Invalid webhook event structure'
    });
  }
  
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
    return res.status(200).json({
      success: true,
      message: 'Event acknowledged but not processed'
    });
  }
  
  next();
};

const webhookTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Webhook processing timeout'
        });
      }
    }, timeoutMs);
    
    res.on('finish', () => {
      clearTimeout(timeout);
    });
    
    next();
  };
};

const webhookRateLimit = () => {
  const attempts = new Map();
  const RATE_LIMIT = 10;
  const WINDOW_MS = 60 * 1000;
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!attempts.has(ip)) {
      attempts.set(ip, []);
    }
    
    const ipAttempts = attempts.get(ip);
    
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