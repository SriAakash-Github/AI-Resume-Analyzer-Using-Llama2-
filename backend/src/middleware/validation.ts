import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ErrorType } from '../types';
import { 
  questionConfigSchema, 
  analysisRequestSchema, 
  questionGenerationSchema,
  guidanceRequestSchema 
} from '../utils/validation';

export const validateQuestionConfig = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = questionConfigSchema.validate(req.body.config);
  
  if (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: error.details.map(detail => detail.message).join(', '),
        timestamp: new Date()
      }
    };
    res.status(400).json(response);
    return;
  }
  
  next();
};

export const validateAnalysisRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = analysisRequestSchema.validate(req.body);
  
  if (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: error.details.map(detail => detail.message).join(', '),
        timestamp: new Date()
      }
    };
    res.status(400).json(response);
    return;
  }
  
  next();
};

export const validateQuestionGeneration = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = questionGenerationSchema.validate(req.body);
  
  if (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: error.details.map(detail => detail.message).join(', '),
        timestamp: new Date()
      }
    };
    res.status(400).json(response);
    return;
  }
  
  next();
};

export const validateGuidanceRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = guidanceRequestSchema.validate(req.body);
  
  if (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: error.details.map(detail => detail.message).join(', '),
        timestamp: new Date()
      }
    };
    res.status(400).json(response);
    return;
  }
  
  next();
};