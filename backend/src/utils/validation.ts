import Joi from 'joi';
import { QuestionConfig, DifficultyLevel } from '../types';

// File validation schemas
export const fileValidationSchema = Joi.object({
  fieldname: Joi.string().required(),
  originalname: Joi.string().required(),
  encoding: Joi.string().required(),
  mimetype: Joi.string().valid('application/pdf').required(),
  size: Joi.number().max(10 * 1024 * 1024).required(), // 10MB max
  buffer: Joi.binary().required()
});

// Question configuration validation
export const questionConfigSchema = Joi.object({
  technicalCount: Joi.number().integer().min(1).max(50).required(),
  behavioralCount: Joi.number().integer().min(1).max(50).required(),
  difficulty: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'Mixed').required()
});

// Analysis request validation
export const analysisRequestSchema = Joi.object({
  fileId: Joi.string().uuid().required()
});

// Question generation request validation
export const questionGenerationSchema = Joi.object({
  analysisId: Joi.string().uuid().required(),
  config: questionConfigSchema.required()
});

// Career guidance request validation
export const guidanceRequestSchema = Joi.object({
  analysisId: Joi.string().uuid().required(),
  targetRole: Joi.string().optional()
});

// Validation helper functions
export const validateQuestionConfig = (config: QuestionConfig): { isValid: boolean; errors: string[] } => {
  const { error } = questionConfigSchema.validate(config);
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    };
  }
  
  return { isValid: true, errors: [] };
};

export const validateFile = (file: Express.Multer.File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check if file exists
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  // Check MIME type
  if (file.mimetype !== 'application/pdf') {
    errors.push('Only PDF files are allowed');
  }
  
  // Check file extension
  if (!file.originalname.toLowerCase().endsWith('.pdf')) {
    errors.push('File must have a .pdf extension');
  }
  
  // Check file size (only if available)
  if (file.size !== undefined) {
    if (file.size === 0) {
      errors.push('File cannot be empty');
    }
    
    if (file.size > 10 * 1024 * 1024) {
      errors.push('File size must be less than 10MB');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Default configurations
export const DEFAULT_QUESTION_CONFIG: QuestionConfig = {
  technicalCount: 10,
  behavioralCount: 10,
  difficulty: 'Mixed' as DifficultyLevel
};

// Validation constants
export const VALIDATION_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['application/pdf'],
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS: 50,
  DIFFICULTY_LEVELS: ['Beginner', 'Intermediate', 'Advanced', 'Mixed'] as DifficultyLevel[]
};