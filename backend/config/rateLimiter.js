/**
 * Rate Limiting Configuration
 * Anti-ban protection for Facebook API
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');

// Create Redis client for distributed rate limiting
let redisClient;

async function createRedisClient() {
  if (!redisClient) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 100, 5000)
        }
      });
      
      await redisClient.connect();
      console.log('Redis connected for rate limiting');
    } catch (error) {
      console.warn('Redis not available, using MemoryStore', error.message);
    }
  }
  return redisClient;
}

// Rate limiting configurations
const limiterConfig = {
  // Facebook API rate limits
  facebookApi: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 200, // Facebook allows ~200 calls/hour per token
    message: 'Too many Facebook API requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // General API rate limits
  generalApi: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Authentication rate limits
  auth: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Max 10 login attempts per hour
    message: 'Too many login attempts, please try again later',
    skip: (req) => req.path === '/api/health'
  },
  
  // Post creation rate limits
  postCreation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Max 50 posts per hour per user
    message: 'Too many posts, please slow down',
    keyGenerator: (req) => {
      return req.user?._id ? `${req.user._id}:post` : req.ip;
    }
  },
  
  // Message sending rate limits
  messageSending: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Max 20 messages per minute per user
    message: 'Too many messages, please wait a moment',
    keyGenerator: (req) => {
      return req.user?._id ? `${req.user._id}:message` : req.ip;
    }
  }
};

// Create limiters
async function createLimiters() {
  const redis = await createRedisClient();
  
  const store = redis ? new RedisStore({
    sendCommand: (...args) => redis.sendCommand(args),
  }) : new rateLimit.MemoryStore();
  
  return {
    facebookApi: rateLimit(limiterConfig.facebookApi),
    generalApi: rateLimit(limiterConfig.generalApi),
    auth: rateLimit(limiterConfig.auth),
    postCreation: rateLimit({
      ...limiterConfig.postCreation,
      store: store
    }),
    messageSending: rateLimit({
      ...limiterConfig.messageSending,
      store: store
    })
  };
}

// Anti-ban middleware
function antiBanMiddleware(req, res, next) {
  // Random delay to avoid pattern detection
  const delay = Math.random() * 1000; // 0-1000ms
  setTimeout(() => {
    next();
  }, delay);
}

// User-Agent rotation for anti-ban
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 10; SM-A505FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Proxy rotation configuration
const proxyConfig = {
  enabled: process.env.PROXY_ENABLED === 'true',
  proxies: process.env.PROXIES?.split(',') || [],
  currentIndex: 0
};

function getNextProxy() {
  if (!proxyConfig.enabled || proxyConfig.proxies.length === 0) {
    return null;
  }
  
  const proxy = proxyConfig.proxies[proxyConfig.currentIndex];
  proxyConfig.currentIndex = (proxyConfig.currentIndex + 1) % proxyConfig.proxies.length;
  return proxy;
}

module.exports = {
  createLimiters,
  antiBanMiddleware,
  getRandomUserAgent,
  getNextProxy,
  createRedisClient
};
