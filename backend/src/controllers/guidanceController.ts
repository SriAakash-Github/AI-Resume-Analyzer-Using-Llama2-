import { Request, Response } from 'express';
import { ApiResponse, ErrorType } from '../types';
import careerGuidanceService from '../services/careerGuidanceService';
import logger from '../utils/logger';

export const generateGuidance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { analysis } = req.body;

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

    logger.info('Generating career guidance', {
      analysisId: analysis.id,
      seniorityLevel: analysis.seniorityLevel
    });

    const roadmap = await careerGuidanceService.generateRoadmap(analysis);

    logger.info('Career guidance generated successfully', {
      roadmapId: roadmap.id,
      targetRole: roadmap.targetRole,
      skillGapsCount: roadmap.skillGaps.length,
      stepsCount: roadmap.recommendedPath.length
    });

    const response: ApiResponse = {
      success: true,
      data: roadmap,
      message: 'Career guidance generated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Career guidance generation failed:', error);

    let errorType = ErrorType.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error during guidance generation';

    if (error instanceof Error) {
      if (error.message.includes('AI') || error.message.includes('Ollama')) {
        errorType = ErrorType.AI_PROCESSING_ERROR;
        message = 'AI guidance service unavailable';
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

export const identifySkillGaps = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skills, targetRole } = req.body;

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

    if (!targetRole) {
      const response: ApiResponse = {
        success: false,
        error: {
          type: ErrorType.VALIDATION_ERROR,
          message: 'Target role is required',
          timestamp: new Date()
        }
      };
      res.status(400).json(response);
      return;
    }

    logger.info('Identifying skill gaps', { targetRole });

    const skillGaps = await careerGuidanceService.identifySkillGaps(skills, targetRole);

    const response: ApiResponse = {
      success: true,
      data: {
        skillGaps,
        targetRole,
        summary: {
          totalGaps: skillGaps.length,
          highPriority: skillGaps.filter(gap => gap.priority === 'High').length,
          mediumPriority: skillGaps.filter(gap => gap.priority === 'Medium').length,
          lowPriority: skillGaps.filter(gap => gap.priority === 'Low').length
        }
      },
      message: 'Skill gaps identified successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Skill gap identification failed:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.AI_PROCESSING_ERROR,
        message: 'Failed to identify skill gaps',
        timestamp: new Date()
      }
    };

    res.status(500).json(response);
  }
};

export const recommendResources = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skillGaps } = req.body;

    if (!skillGaps || !Array.isArray(skillGaps)) {
      const response: ApiResponse = {
        success: false,
        error: {
          type: ErrorType.VALIDATION_ERROR,
          message: 'Skill gaps array is required',
          timestamp: new Date()
        }
      };
      res.status(400).json(response);
      return;
    }

    logger.info('Recommending learning resources', { skillGapsCount: skillGaps.length });

    const resources = await careerGuidanceService.recommendResources(skillGaps);

    const response: ApiResponse = {
      success: true,
      data: {
        resources,
        summary: {
          totalResources: resources.length,
          courses: resources.filter(r => r.type === 'Course').length,
          books: resources.filter(r => r.type === 'Book').length,
          tutorials: resources.filter(r => r.type === 'Tutorial').length,
          practice: resources.filter(r => r.type === 'Practice').length
        }
      },
      message: 'Learning resources recommended successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Resource recommendation failed:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.AI_PROCESSING_ERROR,
        message: 'Failed to recommend resources',
        timestamp: new Date()
      }
    };

    res.status(500).json(response);
  }
};