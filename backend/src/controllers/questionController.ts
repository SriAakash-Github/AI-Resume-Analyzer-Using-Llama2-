import { Request, Response } from 'express';
import { ApiResponse, ErrorType, QuestionConfig } from '../types';
import questionGeneratorService from '../services/questionGeneratorService';
import { validateQuestionConfig } from '../utils/validation';
import logger from '../utils/logger';

export const generateQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { analysis, config } = req.body;

    // Validate request
    if (!analysis) {
      const response: ApiResponse = {
        success: false,
        error: {
          type: ErrorType.VALIDATION_ERROR,
          message: 'Resume analysis data is required',
          timestamp: new Date()
        }
      };
      res.status(400).json(response);
      return;
    }

    if (!config) {
      const response: ApiResponse = {
        success: false,
        error: {
          type: ErrorType.VALIDATION_ERROR,
          message: 'Question configuration is required',
          timestamp: new Date()
        }
      };
      res.status(400).json(response);
      return;
    }

    // Validate question configuration
    const validation = validateQuestionConfig(config as QuestionConfig);
    if (!validation.isValid) {
      const response: ApiResponse = {
        success: false,
        error: {
          type: ErrorType.VALIDATION_ERROR,
          message: validation.errors.join(', '),
          timestamp: new Date()
        }
      };
      res.status(400).json(response);
      return;
    }

    logger.info('Generating questions', {
      technicalCount: config.technicalCount,
      behavioralCount: config.behavioralCount,
      difficulty: config.difficulty
    });

    // Generate questions in parallel
    const [technicalQuestions, behavioralQuestions] = await Promise.all([
      questionGeneratorService.generateTechnicalQuestions(
        analysis.skills,
        config.technicalCount,
        config.difficulty
      ),
      questionGeneratorService.generateBehavioralQuestions(
        analysis.experience,
        config.behavioralCount
      )
    ]);

    const allQuestions = [...technicalQuestions, ...behavioralQuestions];

    logger.info('Questions generated successfully', {
      technicalCount: technicalQuestions.length,
      behavioralCount: behavioralQuestions.length,
      totalCount: allQuestions.length
    });

    const response: ApiResponse = {
      success: true,
      data: {
        questions: allQuestions,
        summary: {
          total: allQuestions.length,
          technical: technicalQuestions.length,
          behavioral: behavioralQuestions.length,
          difficulty: config.difficulty
        }
      },
      message: 'Questions generated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Question generation failed:', error);

    let errorType = ErrorType.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error during question generation';

    if (error instanceof Error) {
      if (error.message.includes('AI') || error.message.includes('Ollama')) {
        errorType = ErrorType.AI_PROCESSING_ERROR;
        message = 'AI question generation service unavailable';
      }
    }

    const response: ApiResponse = {
      success: false,
      error: {
        type: errorType,
        message,
        timestamp: new Date()
      }
    };

    res.status(500).json(response);
  }
};

export const generateTechnicalQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skills, count = 10, difficulty = 'Mixed' } = req.body;

    if (!skills) {
      const response: ApiResponse = {
        success: false,
        error: {
          type: ErrorType.VALIDATION_ERROR,
          message: 'Skills data is required',
          timestamp: new Date()
        }
      };
      res.status(400).json(response);
      return;
    }

    logger.info('Generating technical questions only', { count, difficulty });

    const questions = await questionGeneratorService.generateTechnicalQuestions(
      skills,
      count,
      difficulty
    );

    const response: ApiResponse = {
      success: true,
      data: {
        questions,
        summary: {
          total: questions.length,
          type: 'technical',
          difficulty
        }
      },
      message: 'Technical questions generated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Technical question generation failed:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.AI_PROCESSING_ERROR,
        message: 'Failed to generate technical questions',
        timestamp: new Date()
      }
    };

    res.status(500).json(response);
  }
};

export const generateBehavioralQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { experience, count = 10 } = req.body;

    if (!experience) {
      const response: ApiResponse = {
        success: false,
        error: {
          type: ErrorType.VALIDATION_ERROR,
          message: 'Experience data is required',
          timestamp: new Date()
        }
      };
      res.status(400).json(response);
      return;
    }

    logger.info('Generating behavioral questions only', { count });

    const questions = await questionGeneratorService.generateBehavioralQuestions(
      experience,
      count
    );

    const response: ApiResponse = {
      success: true,
      data: {
        questions,
        summary: {
          total: questions.length,
          type: 'behavioral'
        }
      },
      message: 'Behavioral questions generated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Behavioral question generation failed:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.AI_PROCESSING_ERROR,
        message: 'Failed to generate behavioral questions',
        timestamp: new Date()
      }
    };

    res.status(500).json(response);
  }
};