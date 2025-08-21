// Load environment variables
require('dotenv').config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import fileUploadService from './services/fileUploadService';
import ollamaService from './services/ollamaService';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type')
  });
  next();
});

// API routes
app.use('/api', routes);

// Health check endpoint at root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Resume Analyzer API is running',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    timestamp: new Date()
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Startup function
async function startServer() {
  try {
    // Check Ollama connection
    logger.info('Checking Ollama connection...');
    const ollamaConnected = await ollamaService.checkConnection();
    
    if (ollamaConnected) {
      logger.info('Ollama connection successful');
    } else {
      logger.warn('Ollama connection failed - AI features may not work properly');
    }

    // Start cleanup interval for temporary files
    setInterval(async () => {
      try {
        await fileUploadService.cleanupTempFiles();
      } catch (error) {
        logger.error('Cleanup interval error:', error);
      }
    }, 60 * 60 * 1000); // Run every hour

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        ollamaConnected
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();