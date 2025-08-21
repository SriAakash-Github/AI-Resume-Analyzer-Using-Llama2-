import { QuestionConfig, ValidationError, DifficultyLevel } from '../types';

// Validation constants
export const VALIDATION_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['application/pdf'],
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS: 50,
  DIFFICULTY_LEVELS: ['Beginner', 'Intermediate', 'Advanced', 'Mixed'] as DifficultyLevel[]
};

// File validation
export const validateFile = (file: File): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!file) {
    errors.push({ field: 'file', message: 'Please select a file' });
    return errors;
  }

  if (file.type !== 'application/pdf') {
    errors.push({ field: 'file', message: 'Only PDF files are allowed' });
  }

  if (file.size > VALIDATION_CONSTANTS.MAX_FILE_SIZE) {
    errors.push({ 
      field: 'file', 
      message: `File size must be less than ${VALIDATION_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB` 
    });
  }

  if (file.size === 0) {
    errors.push({ field: 'file', message: 'File cannot be empty' });
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    errors.push({ field: 'file', message: 'File must have a .pdf extension' });
  }

  return errors;
};

// Question configuration validation
export const validateQuestionConfig = (config: QuestionConfig): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!config.technicalCount || config.technicalCount < VALIDATION_CONSTANTS.MIN_QUESTIONS) {
    errors.push({ 
      field: 'technicalCount', 
      message: `Technical questions must be at least ${VALIDATION_CONSTANTS.MIN_QUESTIONS}` 
    });
  }

  if (config.technicalCount > VALIDATION_CONSTANTS.MAX_QUESTIONS) {
    errors.push({ 
      field: 'technicalCount', 
      message: `Technical questions cannot exceed ${VALIDATION_CONSTANTS.MAX_QUESTIONS}` 
    });
  }

  if (!config.behavioralCount || config.behavioralCount < VALIDATION_CONSTANTS.MIN_QUESTIONS) {
    errors.push({ 
      field: 'behavioralCount', 
      message: `Behavioral questions must be at least ${VALIDATION_CONSTANTS.MIN_QUESTIONS}` 
    });
  }

  if (config.behavioralCount > VALIDATION_CONSTANTS.MAX_QUESTIONS) {
    errors.push({ 
      field: 'behavioralCount', 
      message: `Behavioral questions cannot exceed ${VALIDATION_CONSTANTS.MAX_QUESTIONS}` 
    });
  }

  if (!VALIDATION_CONSTANTS.DIFFICULTY_LEVELS.includes(config.difficulty)) {
    errors.push({ 
      field: 'difficulty', 
      message: 'Please select a valid difficulty level' 
    });
  }

  return errors;
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// URL validation
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Phone number validation (basic)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Form validation helper
export const createFormValidator = <T>(
  validationFn: (values: T) => ValidationError[]
) => {
  return (values: T) => {
    const errors = validationFn(values);
    return {
      isValid: errors.length === 0,
      errors
    };
  };
};

// Default configurations
export const DEFAULT_QUESTION_CONFIG: QuestionConfig = {
  technicalCount: 10,
  behavioralCount: 10,
  difficulty: 'Mixed' as DifficultyLevel
};

// Utility functions for form handling
export const getFieldError = (errors: ValidationError[], fieldName: string): string | undefined => {
  const error = errors.find(err => err.field === fieldName);
  return error?.message;
};

export const hasFieldError = (errors: ValidationError[], fieldName: string): boolean => {
  return errors.some(err => err.field === fieldName);
};

export const clearFieldErrors = (errors: ValidationError[], fieldName: string): ValidationError[] => {
  return errors.filter(err => err.field !== fieldName);
};