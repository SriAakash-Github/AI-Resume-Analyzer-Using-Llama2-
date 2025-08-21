import { Router } from 'express';
import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import ollamaService from '../services/ollamaService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/health - Basic health check
router.get('/', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    },
    message: 'Service is healthy'
  };

  res.status(200).json(response);
});

// GET /api/health/ollama - Check Ollama service health
router.get('/ollama', asyncHandler(async (req: Request, res: Response) => {
  const health = await ollamaService.healthCheck();

  const response: ApiResponse = {
    success: health.connected,
    data: health,
    message: health.connected ? 'Ollama service is healthy' : 'Ollama service is unavailable'
  };

  res.status(health.connected ? 200 : 503).json(response);
}));

// GET /api/health/detailed - Detailed health check
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const ollamaHealth = await ollamaService.healthCheck();

  const response: ApiResponse = {
    success: true,
    data: {
      api: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      },
      ollama: ollamaHealth,
      timestamp: new Date()
    },
    message: 'Detailed health check completed'
  };

  res.status(200).json(response);
}));

export default router;