const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const snippetRoutes = require('./routes/snippetRoutes');

const app = express();

const allowedWebOrigins = new Set(
  [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:5173',
    'https://addiiiti.github.io',
    'https://addiiiti.github.io/PrepSnippet',
    ...(process.env.CORS_ALLOWED_ORIGINS || '').split(','),
  ]
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const allowedExtensionIds = (process.env.CHROME_EXTENSION_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

const isAllowedChromeExtensionOrigin = (origin) => {
  if (!origin || !origin.startsWith('chrome-extension://')) return false;

  const extensionId = origin.replace('chrome-extension://', '').replace('/', '');
  if (!extensionId) return false;

  // If no IDs configured, allow extension origins for local MVP development.
  if (allowedExtensionIds.length === 0) return true;

  return allowedExtensionIds.includes(extensionId);
};

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedWebOrigins.has(origin) || isAllowedChromeExtensionOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for code
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PrepSnippet API is running',
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
