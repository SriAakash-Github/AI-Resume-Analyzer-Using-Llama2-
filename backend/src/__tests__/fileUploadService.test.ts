import fileUploadService from '../services/fileUploadService';
import fs from 'fs/promises';
import path from 'path';

// Mock the logger
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('FileUploadService', () => {
  const mockFile: Express.Multer.File = {
    fieldname: 'resume',
    originalname: 'test-resume.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from('mock pdf content'),
    destination: '',
    filename: '',
    path: '',
    stream: {} as any
  };

  const invalidFile: Express.Multer.File = {
    ...mockFile,
    mimetype: 'text/plain',
    originalname: 'test.txt'
  };

  const oversizedFile: Express.Multer.File = {
    ...mockFile,
    size: 15 * 1024 * 1024 // 15MB - over the limit
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFile', () => {
    it('should validate a correct PDF file', () => {
      const result = fileUploadService.validateFile(mockFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-PDF files', () => {
      const result = fileUploadService.validateFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject oversized files', () => {
      const result = fileUploadService.validateFile(oversizedFile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('size'))).toBe(true);
    });

    it('should reject empty files', () => {
      const emptyFile = { ...mockFile, size: 0 };
      const result = fileUploadService.validateFile(emptyFile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('empty'))).toBe(true);
    });
  });

  describe('uploadResume', () => {
    it('should successfully upload a valid file', async () => {
      const result = await fileUploadService.uploadResume(mockFile);
      
      expect(result.success).toBe(true);
      expect(result.fileId).toBeDefined();
      expect(result.fileName).toBe(mockFile.originalname);
      expect(result.message).toBe('File uploaded successfully');
    });

    it('should fail to upload an invalid file', async () => {
      const result = await fileUploadService.uploadResume(invalidFile);
      
      expect(result.success).toBe(false);
      expect(result.fileId).toBe('');
      expect(result.message).toBeDefined();
    });

    it('should generate unique file IDs for multiple uploads', async () => {
      const result1 = await fileUploadService.uploadResume(mockFile);
      const result2 = await fileUploadService.uploadResume(mockFile);
      
      expect(result1.fileId).not.toBe(result2.fileId);
    });
  });

  describe('getFilePath', () => {
    it('should return null for non-existent file ID', async () => {
      const result = await fileUploadService.getFilePath('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('deleteFile', () => {
    it('should return false for non-existent file ID', async () => {
      const result = await fileUploadService.deleteFile('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('cleanupTempFiles', () => {
    it('should complete without errors', async () => {
      await expect(fileUploadService.cleanupTempFiles()).resolves.not.toThrow();
    });
  });

  describe('cleanupOldFiles', () => {
    it('should return number of deleted files', async () => {
      const result = await fileUploadService.cleanupOldFiles(24);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getMulterConfig', () => {
    it('should return valid multer configuration', () => {
      const config = fileUploadService.getMulterConfig();
      
      expect(config).toBeDefined();
      expect(config.limits).toBeDefined();
      expect(config.limits?.fileSize).toBeDefined();
      expect(config.limits?.files).toBe(1);
      expect(config.fileFilter).toBeDefined();
    });
  });
});