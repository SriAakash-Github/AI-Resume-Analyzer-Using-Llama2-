import { Request, Response } from 'express';
import { ApiResponse, ErrorType } from '../types';
import fileUploadService from '../services/fileUploadService';
import pdfParserService from '../services/pdfParserService';
import aiAnalysisService from '../services/aiAnalysisService';
import logger from '../utils/logger';

export const analyzeResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      const response: ApiResponse = {
        success: false,
        error: {
          type: ErrorType.VALIDATION_ERROR,
          message: 'File ID is required',
          timestamp: new Date()
        }
      };
      res.status(400).json(response);
      return;
    }

    logger.info('Starting resume analysis', { fileId });

    // Get file path
    const filePath = await fileUploadService.getFilePath(fileId);
    if (!filePath) {
      const response: ApiResponse = {
        success: false,
        error: {
          type: ErrorType.FILE_UPLOAD_ERROR,
          message: 'File not found',
          timestamp: new Date()
        }
      };
      res.status(404).json(response);
      return;
    }

    // Extract content from PDF
    logger.info('Extracting PDF content', { fileId });
    const extractedContent = await pdfParserService.extractText(filePath);

    // Analyze resume content
    logger.info('Analyzing resume content', { fileId });
    const analysis = await aiAnalysisService.analyzeResume(extractedContent);

    // Update analysis with correct file info
    analysis.fileName = fileId; // This could be improved to store original filename

    logger.info('Resume analysis completed', {
      fileId,
      analysisId: analysis.id,
      seniorityLevel: analysis.seniorityLevel,
      skillsCount: analysis.skills.technical.length + analysis.skills.languages.length
    });

    const response: ApiResponse = {
      success: true,
      data: analysis,
      message: 'Resume analyzed successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Resume analysis failed:', error);

    let errorType = ErrorType.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error during analysis';

    if (error instanceof Error) {
      if (error.message.includes('PDF parsing failed')) {
        errorType = ErrorType.PDF_PARSING_ERROR;
        message = 'Failed to parse PDF file';
      } else if (error.message.includes('AI') || error.message.includes('Ollama')) {
        errorType = ErrorType.AI_PROCESSING_ERROR;
        message = 'AI analysis service unavailable';
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

export const getAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { analysisId } = req.params;

    if (!analysisId) {
      const response: ApiResponse = {
        success: false,
        error: {
          type: ErrorType.VALIDATION_ERROR,
          message: 'Analysis ID is required',
          timestamp: new Date()
        }
      };
      res.status(400).json(response);
      return;
    }

    // In a real implementation, you would retrieve the analysis from a database
    // For now, we'll return an error since we don't have persistent storage
    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Analysis retrieval not implemented - analyses are not persisted',
        timestamp: new Date()
      }
    };

    res.status(501).json(response);
  } catch (error) {
    logger.error('Get analysis failed:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        timestamp: new Date()
      }
    };

    res.status(500).json(response);
  }
};