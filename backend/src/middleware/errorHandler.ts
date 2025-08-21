import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ErrorType } from '../types';
import logger from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  // Handle Multer errors (file upload)
  if (error.name === 'MulterError') {
    let message = 'File upload error';
    let statusCode = 400;

    switch (error.message) {
      case 'File too large':
        message = 'File size exceeds the maximum limit of 10MB';
        break;
      case 'Too many files':
        message = 'Only one file is allowed';
        break;
      case 'Unexpected field':
        message = 'Invalid file field name';
        break;
      default:
        message = error.message;
    }

    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.FILE_UPLOAD_ERROR,
        message,
        timestamp: new Date()
      }
    };

    res.status(statusCode).json(response);
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: error.message,
        timestamp: new Date()
      }
    };

    res.status(400).json(response);
    return;
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Invalid JSON in request body',
        timestamp: new Date()
      }
    };

    res.status(400).json(response);
    return;
  }

  // Default error response
  const response: ApiResponse = {
    success: false,
    error: {
      type: ErrorType.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      timestamp: new Date()
    }
  };

  res.status(500).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      type: ErrorType.VALIDATION_ERROR,
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date()
    }
  };

  res.status(404).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};