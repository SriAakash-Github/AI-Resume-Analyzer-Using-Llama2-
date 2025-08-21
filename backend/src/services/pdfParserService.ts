import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import { PDFParserService, ExtractedContent, ResumeStructure, ErrorType } from '../types';
import logger from '../utils/logger';

class PDFParserServiceImpl implements PDFParserService {
  private readonly sectionKeywords = {
    experience: ['experience', 'work history', 'employment', 'professional experience', 'career history'],
    education: ['education', 'academic background', 'qualifications', 'degrees'],
    skills: ['skills', 'technical skills', 'competencies', 'technologies', 'expertise'],
    projects: ['projects', 'portfolio', 'work samples', 'personal projects'],
    summary: ['summary', 'profile', 'objective', 'about', 'overview'],
    contact: ['contact', 'personal information', 'details'],
    certifications: ['certifications', 'certificates', 'licenses', 'credentials']
  };

  public async extractText(filePath: string): Promise<ExtractedContent> {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read the PDF file
      const dataBuffer = await fs.readFile(filePath);
      
      // Parse PDF
      const pdfData = await pdfParse(dataBuffer);
      
      // Extract structure
      const structure = await this.extractStructure(filePath);
      
      const extractedContent: ExtractedContent = {
        text: pdfData.text,
        structure,
        metadata: {
          pageCount: pdfData.numpages,
          fileSize: dataBuffer.length,
          extractionMethod: 'text'
        }
      };

      logger.info('PDF text extraction successful', {
        pageCount: pdfData.numpages,
        textLength: pdfData.text.length,
        fileSize: dataBuffer.length
      });

      return extractedContent;

    } catch (error) {
      logger.error('PDF text extraction failed:', error);
      
      // Try OCR as fallback
      try {
        logger.info('Attempting OCR fallback for PDF parsing');
        const ocrText = await this.handleOCR(filePath);
        
        const structure = this.analyzeTextStructure(ocrText);
        
        return {
          text: ocrText,
          structure,
          metadata: {
            pageCount: 1, // OCR doesn't provide page count easily
            fileSize: (await fs.stat(filePath)).size,
            extractionMethod: 'ocr'
          }
        };
      } catch (ocrError) {
        logger.error('OCR fallback also failed:', ocrError);
        throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  public async extractStructure(filePath: string): Promise<ResumeStructure> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      return this.analyzeTextStructure(pdfData.text);
    } catch (error) {
      logger.error('PDF structure extraction failed:', error);
      throw new Error(`Structure extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async handleOCR(filePath: string): Promise<string> {
    // Note: This is a placeholder for OCR functionality
    // In a real implementation, you would use libraries like:
    // - tesseract.js for client-side OCR
    // - node-tesseract-ocr for server-side OCR
    // - pdf2pic to convert PDF to images first
    
    logger.warn('OCR functionality not fully implemented - returning placeholder text');
    
    try {
      // For now, we'll try to extract whatever text we can from the PDF
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer, {
        // More aggressive parsing options
        max: 0, // No limit on pages
        version: 'v1.10.100'
      });
      
      if (pdfData.text && pdfData.text.trim().length > 0) {
        return pdfData.text;
      }
      
      // If no text found, return a message indicating OCR is needed
      throw new Error('PDF appears to be image-based and requires OCR processing');
      
    } catch (error) {
      logger.error('OCR processing failed:', error);
      throw new Error('OCR processing not available - please ensure PDF contains selectable text');
    }
  }

  private analyzeTextStructure(text: string): ResumeStructure {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const sections: { [key: string]: { startIndex: number; endIndex: number; content: string } } = {};
    const detectedSections: string[] = [];

    let currentSection = '';
    let sectionStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Check if this line is a section header
      const detectedSectionType = this.detectSectionType(line);
      
      if (detectedSectionType) {
        // Save previous section if it exists
        if (currentSection && sectionStart < i) {
          const sectionContent = lines.slice(sectionStart, i).join('\n');
          sections[currentSection] = {
            startIndex: sectionStart,
            endIndex: i - 1,
            content: sectionContent
          };
        }
        
        // Start new section
        currentSection = detectedSectionType;
        sectionStart = i;
        
        if (!detectedSections.includes(detectedSectionType)) {
          detectedSections.push(detectedSectionType);
        }
      }
    }

    // Handle the last section
    if (currentSection && sectionStart < lines.length) {
      const sectionContent = lines.slice(sectionStart).join('\n');
      sections[currentSection] = {
        startIndex: sectionStart,
        endIndex: lines.length - 1,
        content: sectionContent
      };
    }

    // If no sections detected, treat entire text as summary
    if (detectedSections.length === 0) {
      sections['summary'] = {
        startIndex: 0,
        endIndex: lines.length - 1,
        content: text
      };
      detectedSections.push('summary');
    }

    logger.info('Resume structure analysis completed', {
      sectionsFound: detectedSections.length,
      sections: detectedSections
    });

    return {
      sections,
      detectedSections
    };
  }

  private detectSectionType(line: string): string | null {
    const normalizedLine = line.toLowerCase().trim();
    
    // Remove common formatting characters
    const cleanLine = normalizedLine.replace(/[:\-_=]/g, '').trim();
    
    for (const [sectionType, keywords] of Object.entries(this.sectionKeywords)) {
      for (const keyword of keywords) {
        if (cleanLine.includes(keyword.toLowerCase()) || 
            cleanLine === keyword.toLowerCase() ||
            cleanLine.startsWith(keyword.toLowerCase())) {
          return sectionType;
        }
      }
    }

    // Check for common section patterns
    if (normalizedLine.match(/^(work|professional)\s+(experience|history)/)) {
      return 'experience';
    }
    
    if (normalizedLine.match(/^(technical|core)\s+skills/)) {
      return 'skills';
    }
    
    if (normalizedLine.match(/^(personal|side)\s+projects/)) {
      return 'projects';
    }

    return null;
  }

  public validatePDFFile(filePath: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        const dataBuffer = await fs.readFile(filePath);
        
        // Check PDF magic number
        const pdfHeader = dataBuffer.slice(0, 4).toString();
        if (!pdfHeader.startsWith('%PDF')) {
          resolve(false);
          return;
        }

        // Try to parse the PDF
        await pdfParse(dataBuffer);
        resolve(true);
      } catch (error) {
        logger.warn('PDF validation failed:', error);
        resolve(false);
      }
    });
  }

  public async getTextPreview(filePath: string, maxLength: number = 500): Promise<string> {
    try {
      const content = await this.extractText(filePath);
      const preview = content.text.substring(0, maxLength);
      return preview + (content.text.length > maxLength ? '...' : '');
    } catch (error) {
      logger.error('Failed to generate text preview:', error);
      return 'Preview not available';
    }
  }
}

export default new PDFParserServiceImpl();