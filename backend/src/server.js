const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'JWT_COOKIE_EXPIRE',
  'PORT'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Optional environment variables for Xilnex integration
const xilnexEnabled = process.env.XILNEX_ENABLED === 'true';
if (xilnexEnabled) {
  const xilnexRequiredVars = ['XILNEX_API_URL', 'XILNEX_APPID', 'XILNEX_APPTOKEN', 'XILNEX_AUTH'];
  const missingXilnexVars = xilnexRequiredVars.filter(envVar => !process.env[envVar]);
  
  if (missingXilnexVars.length > 0) {
    console.warn('⚠️  Xilnex integration is enabled but missing required variables:');
    missingXilnexVars.forEach(envVar => {
      console.warn(`   - ${envVar}`);
    });
    console.warn('Xilnex integration will be disabled.');
  }
}

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const contactRoutes = require('./routes/contacts');
const customerRoutes = require('./routes/customers');
const outletRoutes = require('./routes/outlets');

const app = express();

// Trust proxy - required when behind IIS or other reverse proxy
// Trust only the immediate proxy (more secure than 'true')
app.set('trust proxy', 1);

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - more restrictive for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 60 : 100, // More restrictive in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to handle proxy IPs properly
  keyGenerator: (req) => {
    // Get the real IP, fallback to connection remote address
    const forwardedIps = req.get('X-Forwarded-For');
    let clientIp = req.ip;
    
    if (forwardedIps) {
      // Take the first IP from the X-Forwarded-For header
      clientIp = forwardedIps.split(',')[0].trim();
    }
    
    // Remove port if present (e.g., "192.168.1.1:12345" -> "192.168.1.1")
    clientIp = clientIp.split(':')[0];
    
    return clientIp;
  },
  // Skip rate limiting for internal/trusted requests
  skip: (req) => {
    const ip = req.ip;
    // Skip rate limiting for localhost and internal network
    return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');
  }
});
app.use(limiter);

// CORS configuration - handle both direct and proxied requests
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3310',
      'http://localhost:3310', // Development frontend
      'http://192.168.100.19:3310' // Production frontend
    ];
    
    // Allow requests with no origin (happens with proxy requests, mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log the rejected origin for debugging
      console.log(`CORS rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Body parsing middleware - reduced limits for production
const bodyLimit = process.env.NODE_ENV === 'production' ? '1mb' : '10mb';
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

// Compression middleware
app.use(compression());

// Logging middleware - conditional based on environment
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'CRM Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/outlets', outletRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err, origin) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});

module.exports = app;