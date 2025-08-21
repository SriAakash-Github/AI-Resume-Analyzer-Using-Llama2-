// Frontend types - mirrors backend types for consistency

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

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    message: string;
    details?: any;
    timestamp: Date;
  };
  message?: string;
}

export interface UploadResult {
  success: boolean;
  fileId: string;
  fileName: string;
  message?: string;
}

// UI State types
export interface UploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
  uploadedFile?: File;
  fileId?: string;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  progress: number;
  currentStep: string;
  error?: string;
  analysis?: ResumeAnalysis;
}

export interface QuestionGenerationState {
  isGenerating: boolean;
  progress: number;
  error?: string;
  questions?: Question[];
  config: QuestionConfig;
}

export interface GuidanceState {
  isGenerating: boolean;
  error?: string;
  roadmap?: CareerRoadmap;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  values: T;
  errors: ValidationError[];
  isValid: boolean;
  isDirty: boolean;
}

// Export functionality types
export interface ExportOptions {
  format: 'pdf' | 'txt' | 'json';
  includeQuestions: boolean;
  includeGuidance: boolean;
  includeAnalysis: boolean;
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  error?: string;
}