import pdfParserService from '../services/pdfParserService';
import fs from 'fs/promises';
import path from 'path';

// Mock the logger
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock pdf-parse
jest.mock('pdf-parse', () => {
  return jest.fn().mockImplementation((buffer) => {
    // Mock successful PDF parsing
    return Promise.resolve({
      numpages: 2,
      text: `John Doe
Software Engineer
john.doe@email.com

EXPERIENCE
Senior Software Engineer at Tech Corp
2020 - Present
- Developed web applications using React and Node.js
- Led a team of 5 developers

EDUCATION
Bachelor of Computer Science
University of Technology
2016 - 2020

SKILLS
JavaScript, React, Node.js, Python, SQL`,
      info: {
        PDFFormatVersion: '1.4',
        IsAcroFormPresent: false,
        IsXFAPresent: false
      }
    });
  });
});

// Mock fs promises
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn()
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('PDFParserService', () => {
  const testFilePath = '/test/path/resume.pdf';
  const mockPDFBuffer = Buffer.from('mock pdf content');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(mockPDFBuffer);
    mockFs.stat.mockResolvedValue({ size: 1024 } as any);
  });

  describe('extractText', () => {
    it('should successfully extract text from PDF', async () => {
      const result = await pdfParserService.extractText(testFilePath);

      expect(result).toBeDefined();
      expect(result.text).toContain('John Doe');
      expect(result.text).toContain('Software Engineer');
      expect(result.metadata.pageCount).toBe(2);
      expect(result.metadata.extractionMethod).toBe('text');
      expect(result.structure).toBeDefined();
      expect(result.structure.detectedSections).toContain('experience');
      expect(result.structure.detectedSections).toContain('education');
      expect(result.structure.detectedSections).toContain('skills');
    });

    it('should handle file access errors', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      await expect(pdfParserService.extractText(testFilePath))
        .rejects.toThrow('PDF parsing failed');
    });

    it('should attempt OCR fallback when text extraction fails', async () => {
      const pdfParse = require('pdf-parse');
      pdfParse.mockRejectedValueOnce(new Error('PDF parsing failed'));
      
      // Mock successful OCR fallback
      pdfParse.mockResolvedValueOnce({
        numpages: 1,
        text: 'OCR extracted text',
        info: {}
      });

      const result = await pdfParserService.extractText(testFilePath);

      expect(result.text).toBe('OCR extracted text');
      expect(result.metadata.extractionMethod).toBe('ocr');
    });
  });

  describe('extractStructure', () => {
    it('should extract resume structure from PDF', async () => {
      const result = await pdfParserService.extractStructure(testFilePath);

      expect(result).toBeDefined();
      expect(result.detectedSections).toBeInstanceOf(Array);
      expect(result.sections).toBeDefined();
      expect(result.detectedSections.length).toBeGreaterThan(0);
    });

    it('should handle structure extraction errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('Read error'));

      await expect(pdfParserService.extractStructure(testFilePath))
        .rejects.toThrow('Structure extraction failed');
    });
  });

  describe('handleOCR', () => {
    it('should attempt OCR processing', async () => {
      const result = await pdfParserService.handleOCR(testFilePath);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle OCR failures gracefully', async () => {
      const pdfParse = require('pdf-parse');
      pdfParse.mockRejectedValue(new Error('OCR failed'));

      await expect(pdfParserService.handleOCR(testFilePath))
        .rejects.toThrow('OCR processing not available');
    });
  });

  describe('validatePDFFile', () => {
    it('should validate a correct PDF file', async () => {
      // Mock PDF header
      const pdfBuffer = Buffer.from('%PDF-1.4\nrest of pdf content');
      mockFs.readFile.mockResolvedValue(pdfBuffer);

      const result = await pdfParserService.validatePDFFile(testFilePath);

      expect(result).toBe(true);
    });

    it('should reject non-PDF files', async () => {
      // Mock non-PDF header
      const nonPdfBuffer = Buffer.from('Not a PDF file');
      mockFs.readFile.mockResolvedValue(nonPdfBuffer);

      const result = await pdfParserService.validatePDFFile(testFilePath);

      expect(result).toBe(false);
    });

    it('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File read error'));

      const result = await pdfParserService.validatePDFFile(testFilePath);

      expect(result).toBe(false);
    });
  });

  describe('getTextPreview', () => {
    it('should return text preview with default length', async () => {
      const result = await pdfParserService.getTextPreview(testFilePath);

      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThanOrEqual(500);
    });

    it('should return text preview with custom length', async () => {
      const customLength = 100;
      const result = await pdfParserService.getTextPreview(testFilePath, customLength);

      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThanOrEqual(customLength + 3); // +3 for '...'
    });

    it('should handle preview generation errors', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const result = await pdfParserService.getTextPreview(testFilePath);

      expect(result).toBe('Preview not available');
    });
  });

  describe('section detection', () => {
    it('should detect common resume sections', async () => {
      const result = await pdfParserService.extractText(testFilePath);

      expect(result.structure.detectedSections).toContain('experience');
      expect(result.structure.detectedSections).toContain('education');
      expect(result.structure.detectedSections).toContain('skills');
    });

    it('should handle resumes without clear sections', async () => {
      const pdfParse = require('pdf-parse');
      pdfParse.mockResolvedValueOnce({
        numpages: 1,
        text: 'Just some random text without clear sections',
        info: {}
      });

      const result = await pdfParserService.extractText(testFilePath);

      expect(result.structure.detectedSections).toContain('summary');
      expect(result.structure.sections.summary).toBeDefined();
    });
  });
});