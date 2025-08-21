import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadService, UploadResult, ValidationResult } from '../types';
import { validateFile } from '../utils/validation';
import logger from '../utils/logger';

class FileUploadServiceImpl implements FileUploadService {
  private uploadDir: string;
  private maxFileSize: number;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './temp-files';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info(`Created upload directory: ${this.uploadDir}`);
    }
  }

  public getMulterConfig(): multer.Options {
    return {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: this.maxFileSize,
        files: 1
      },
      fileFilter: (req, file, cb) => {
        // Only do basic MIME type validation here
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only PDF files are allowed'));
        }
      }
    };
  }

  public validateFile(file: Express.Multer.File): ValidationResult {
    return validateFile(file);
  }

  public async uploadResume(file: Express.Multer.File): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          fileId: '',
          fileName: file.originalname,
          message: validation.errors.join(', ')
        };
      }

      // Generate unique file ID and path
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${fileId}${fileExtension}`;
      const filePath = path.join(this.uploadDir, fileName);

      // Save file to disk
      await fs.writeFile(filePath, file.buffer);

      logger.info(`File uploaded successfully: ${fileName}`, {
        fileId,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });

      return {
        success: true,
        fileId,
        fileName: file.originalname,
        message: 'File uploaded successfully'
      };

    } catch (error) {
      logger.error('File upload failed:', error);
      return {
        success: false,
        fileId: '',
        fileName: file.originalname,
        message: 'File upload failed'
      };
    }
  }

  public async getFilePath(fileId: string): Promise<string | null> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const matchingFile = files.find(file => file.startsWith(fileId));
      
      if (matchingFile) {
        return path.join(this.uploadDir, matchingFile);
      }
      
      return null;
    } catch (error) {
      logger.error('Error finding file:', error);
      return null;
    }
  }

  public async deleteFile(fileId: string): Promise<boolean> {
    try {
      const filePath = await this.getFilePath(fileId);
      if (filePath) {
        await fs.unlink(filePath);
        logger.info(`File deleted: ${fileId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error deleting file:', error);
      return false;
    }
  }

  public async cleanupTempFiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          logger.info(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }

  public async cleanupOldFiles(maxAgeHours: number = 24): Promise<number> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
          logger.info(`Cleaned up old file: ${file}`);
        }
      }

      logger.info(`Cleanup completed. Deleted ${deletedCount} files.`);
      return deletedCount;
    } catch (error) {
      logger.error('Error during cleanup:', error);
      return 0;
    }
  }
}

export default new FileUploadServiceImpl();