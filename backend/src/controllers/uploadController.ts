import { Request, Response } from 'express';
import multer from 'multer';
import fileUploadService from '../services/fileUploadService';
import { ApiResponse, ErrorType } from '../types';
import logger from '../utils/logger';

// Configure multer with our service
const upload = multer(fileUploadService.getMulterConfig());

export const uploadMiddleware = upload.single('resume');

export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Upload request received', {
      hasFile: !!req.file,
      contentType: req.get('Content-Type'),
      method: req.method
    });

    if (!req.file) {
      logger.warn('No file in upload request');
      const response: ApiResponse = {
        success: false,
        error: {
          type: ErrorType.VALIDATION_ERROR,
          message: 'No file uploaded',
          timestamp: new Date()
        }
      };
      res.status(400).json(response);
      return;
    }

    logger.info('Processing file upload', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const result = await fileUploadService.uploadResume(req.file);

    if (result.success) {
      logger.info('File upload successful', { fileId: result.fileId });
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'File uploaded successfully'
      };
      res.status(200).json(response);
    } else {
      logger.warn('File upload failed', { message: result.message });
      const response: ApiResponse = {
        success: false,
        error: {
          type: ErrorType.FILE_UPLOAD_ERROR,
          message: result.message || 'Upload failed',
          timestamp: new Date()
        }
      };
      res.status(400).json(response);
    }
  } catch (error) {
    logger.error('Upload controller error:', error);
    
    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.INTERNAL_SERVER_ERROR,
        message: 'Internal server error during file upload',
        timestamp: new Date()
      }
    };
    res.status(500).json(response);
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;

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

    const deleted = await fileUploadService.deleteFile(fileId);

    if (deleted) {
      const response: ApiResponse = {
        success: true,
        message: 'File deleted successfully'
      };
      res.status(200).json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: {
          type: ErrorType.FILE_UPLOAD_ERROR,
          message: 'File not found or could not be deleted',
          timestamp: new Date()
        }
      };
      res.status(404).json(response);
    }
  } catch (error) {
    logger.error('Delete file controller error:', error);
    
    const response: ApiResponse = {
      success: false,
      error: {
        type: ErrorType.INTERNAL_SERVER_ERROR,
        message: 'Internal server error during file deletion',
        timestamp: new Date()
      }
    };
    res.status(500).json(response);
  }
};