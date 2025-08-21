// Core data models for resume analysis

export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
}

export interface ExperienceSection {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  responsibilities: string[];
  technologies?: string[];
  achievements?: string[];
}

export interface EducationSection {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  honors?: string[];
  relevantCoursework?: string[];
}

export interface ProjectSection {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  startDate?: string;
  endDate?: string;
  url?: string;
  github?: string;
  achievements?: string[];
}

export interface TechnicalSkill {
  name: string;
  category: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  yearsOfExperience?: number;
}

export interface SoftSkill {
  name: string;
  description?: string;
}

export interface ProgrammingLanguage {
  name: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  yearsOfExperience?: number;
}

export interface Framework {
  name: string;
  category: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  yearsOfExperience?: number;
}

export interface Tool {
  name: string;
  category: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface SkillSet {
  technical: TechnicalSkill[];
  soft: SoftSkill[];
  languages: ProgrammingLanguage[];
  frameworks: Framework[];
  tools: Tool[];
}

export type SeniorityLevel = 'Entry' | 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal';

export interface ResumeAnalysis {
  id: string;
  fileName: string;
  uploadedAt: Date;
  personalInfo: PersonalInfo;
  experience: ExperienceSection[];
  education: EducationSection[];
  skills: SkillSet;
  projects: ProjectSection[];
  seniorityLevel: SeniorityLevel;
  careerSummary: string;
  totalExperienceYears: number;
}

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Mixed';

export interface Question {
  id: string;
  type: 'technical' | 'behavioral';
  difficulty: DifficultyLevel;
  question: string;
  category: string;
  suggestedAnswerFramework?: string;
  relatedSkills: string[];
  estimatedTime?: string;
}

export interface QuestionConfig {
  technicalCount: number; // 1-50
  behavioralCount: number; // 1-50
  difficulty: DifficultyLevel;
}

export interface SkillGap {
  skill: string;
  currentLevel: 'None' | 'Beginner' | 'Intermediate' | 'Advanced';
  targetLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  priority: 'High' | 'Medium' | 'Low';
  estimatedLearningTime: string;
}

export interface LearningResource {
  title: string;
  type: 'Course' | 'Book' | 'Tutorial' | 'Documentation' | 'Practice';
  url?: string;
  description: string;
  estimatedTime: string;
  difficulty: DifficultyLevel;
}

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  skills: string[];
  estimatedTime: string;
  priority: 'High' | 'Medium' | 'Low';
  resources: LearningResource[];
  prerequisites?: string[];
}

export interface CareerRoadmap {
  id: string;
  currentLevel: SeniorityLevel;
  targetRole?: string;
  recommendedPath: RoadmapStep[];
  skillGaps: SkillGap[];
  timelineEstimate: string;
  overallPriority: 'High' | 'Medium' | 'Low';
}

// API Request/Response types
export interface UploadResult {
  success: boolean;
  fileId: string;
  fileName: string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ExtractedContent {
  text: string;
  structure: ResumeStructure;
  metadata: {
    pageCount: number;
    fileSize: number;
    extractionMethod: 'text' | 'ocr';
  };
}

export interface ResumeStructure {
  sections: {
    [key: string]: {
      startIndex: number;
      endIndex: number;
      content: string;
    };
  };
  detectedSections: string[];
}

// Error types
export enum ErrorType {
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  PDF_PARSING_ERROR = 'PDF_PARSING_ERROR',
  AI_PROCESSING_ERROR = 'AI_PROCESSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OLLAMA_CONNECTION_ERROR = 'OLLAMA_CONNECTION_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

export interface ApiError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

// Service interfaces
export interface FileUploadService {
  uploadResume(file: Express.Multer.File): Promise<UploadResult>;
  validateFile(file: Express.Multer.File): ValidationResult;
  cleanupTempFiles(): Promise<void>;
}

export interface PDFParserService {
  extractText(filePath: string): Promise<ExtractedContent>;
  extractStructure(filePath: string): Promise<ResumeStructure>;
  handleOCR(filePath: string): Promise<string>;
}

export interface AIAnalysisService {
  analyzeResume(content: ExtractedContent): Promise<ResumeAnalysis>;
  extractSkills(content: string): Promise<SkillSet>;
  determineSeniority(experience: ExperienceSection[]): Promise<SeniorityLevel>;
}

export interface QuestionGeneratorService {
  generateTechnicalQuestions(
    skills: SkillSet,
    count: number,
    difficulty: DifficultyLevel
  ): Promise<Question[]>;
  generateBehavioralQuestions(
    experience: ExperienceSection[],
    count: number
  ): Promise<Question[]>;
}

export interface CareerGuidanceService {
  generateRoadmap(analysis: ResumeAnalysis): Promise<CareerRoadmap>;
  identifySkillGaps(currentSkills: SkillSet, targetRole: string): Promise<SkillGap[]>;
  recommendResources(skillGaps: SkillGap[]): Promise<LearningResource[]>;
}