require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const http = require('http');
const socketIo = require('socket.io');
const winston = require('winston');
const path = require('path');
const { createLimiters, antiBanMiddleware } = require('./config/rateLimiter');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Load passport configuration
require('./config/passport');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport if enabled
if (process.env.LOG_FILES_ENABLED === 'true') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log' 
  }));
}

// Initialize rate limiters
let limiters = {};
createLimiters().then((createdLimiters) => {
  limiters = createdLimiters;
  logger.info('Rate limiters initialized');
}).catch(err => {
  logger.error('Error initializing rate limiters:', err);
});

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  name: process.env.SESSION_COOKIE_NAME || 'dark-fb-session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE) || 86400000,
    sameSite: 'lax'
  }
};

// Apply session middleware
app.use(session(sessionConfig));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || "http://localhost:3000",
  methods: process.env.CORS_METHODS?.split(',') || ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: process.env.CORS_CREDENTIALS === 'true'
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Morgan logging
app.use(morgan('combined', { 
  stream: { 
    write: (message) => logger.info(message.trim()) 
  } 
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const connectDB = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    if (process.env.NODE_ENV === 'production') {
      options.retryWrites = true;
      options.w = 'majority';
    }
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    logger.info('MongoDB connected successfully');
    
    // Connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Socket.io connection
io.on('connection', (socket) => {
  logger.info(`New socket connection: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
  
  socket.on('join-room', (room) => {
    socket.join(room);
    logger.info(`Socket ${socket.id} joined room: ${room}`);
  });
  
  socket.on('leave-room', (room) => {
    socket.leave(room);
    logger.info(`Socket ${socket.id} left room: ${room}`);
  });
});

// Attach io to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const facebookRoutes = require('./routes/facebookRoutes');
const facebookAccountRoutes = require('./routes/facebookAccountRoutes');
const postRoutes = require('./routes/postRoutes');
const messageRoutes = require('./routes/messageRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const scheduledRoutes = require('./routes/scheduledRoutes');

// Apply rate limiting to API routes
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for health check
  if (req.path === '/health' || req.path === '/') {
    return next();
  }
  
  // Apply general rate limiting
  if (limiters.generalApi) {
    return limiters.generalApi(req, res, next);
  }
  
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/facebook', facebookRoutes);
app.use('/api/facebook-accounts', facebookAccountRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/scheduled', scheduledRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'dark-fb-api',
    version: '2.0.0',
    features: {
      multiAuth: process.env.MULTI_PROVIDER_AUTH === 'true',
      antiBan: process.env.ANTI_BAN_ENABLED === 'true',
      realtime: process.env.REALTIME_NOTIFICATIONS === 'true',
      analytics: process.env.ANALYTICS_ENABLED === 'true',
      scheduling: process.env.SCHEDULED_POSTS === 'true'
    }
  });
});

// API Documentation endpoint (Swagger)
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DARK-FB API',
      version: '2.0.0',
      description: 'Professional Facebook Bot API with Anti-Ban Protection, Multi-Provider Authentication, and Advanced Features',
      contact: {
        name: 'onlynewsao-cmyk',
        url: 'https://github.com/onlynewsao-cmyk/DARK-FB'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Local development server'
      },
      {
        url: process.env.RENDER_URL || 'https://dark-fb-api.onrender.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './models/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DARK-FB API Documentation'
}));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Invalid token. Please log in again.'
    });
  }
  
  // Handle token expiration
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Token expired. Please log in again.'
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation error',
      details: err.message
    });
  }
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  await connectDB();
  
  logger.info(`╔════════════════════════════════════════════════════════════╗`);
  logger.info(`║                                                           ║`);
  logger.info(`║           🚀 DARK-FB API Server Running 🚀               ║`);
  logger.info(`║                                                           ║`);
  logger.info(`║   📍 Local:    http://localhost:${PORT}                   ║`);
  logger.info(`║   📖 Docs:     http://localhost:${PORT}/api-docs          ║`);
  logger.info(`║   ❤️  Health:  http://localhost:${PORT}/api/health         ║`);
  logger.info(`║                                                           ║`);
  logger.info(`║   Environment: ${process.env.NODE_ENV || 'development'}                            ║`);
  logger.info(`║   Version:    2.0.0                                       ║`);
  logger.info(`║                                                           ║`);
  logger.info(`╚════════════════════════════════════════════════════════════╝`);
  
  // Log features
  logger.info('Features enabled:');
  logger.info(`  ✓ Multi-Provider Auth: ${process.env.MULTI_PROVIDER_AUTH === 'true'}`);
  logger.info(`  ✓ Anti-Ban Protection: ${process.env.ANTI_BAN_ENABLED === 'true'}`);
  logger.info(`  ✓ Real-time Notifications: ${process.env.REALTIME_NOTIFICATIONS === 'true'}`);
  logger.info(`  ✓ Analytics: ${process.env.ANALYTICS_ENABLED === 'true'}`);
  logger.info(`  ✓ Scheduled Posts: ${process.env.SCHEDULED_POSTS === 'true'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  
  // Close MongoDB connection
  await mongoose.connection.close();
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  
  await mongoose.connection.close();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

// Unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
});

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = { app, server, io };
