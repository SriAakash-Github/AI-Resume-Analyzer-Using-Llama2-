import { v4 as uuidv4 } from 'uuid';
import {
  AIAnalysisService,
  ExtractedContent,
  ResumeAnalysis,
  SkillSet,
  ExperienceSection,
  SeniorityLevel,
  PersonalInfo,
  EducationSection,
  ProjectSection,
  TechnicalSkill,
  SoftSkill,
  ProgrammingLanguage,
  Framework,
  Tool
} from '../types';
import ollamaService from './ollamaService';
import logger from '../utils/logger';

class AIAnalysisServiceImpl implements AIAnalysisService {
  private readonly model: string;

  constructor() {
    this.model = process.env.OLLAMA_ANALYSIS_MODEL || 'llama2';
    logger.info('AI Analysis Service initialized', { 
      model: this.model,
      envVar: process.env.OLLAMA_ANALYSIS_MODEL 
    });
  }

  public async analyzeResume(content: ExtractedContent): Promise<ResumeAnalysis> {
    try {
      logger.info('Starting comprehensive resume analysis');

      // Extract different components in parallel for better performance
      const [personalInfo, skills, experience, education, projects] = await Promise.all([
        this.extractPersonalInfo(content.text),
        this.extractSkills(content.text),
        this.extractExperience(content.text),
        this.extractEducation(content.text),
        this.extractProjects(content.text)
      ]);

      // Determine seniority level based on experience
      const seniorityLevel = await this.determineSeniority(experience);

      // Generate career summary
      const careerSummary = await this.generateCareerSummary(content.text, experience, skills);

      // Calculate total experience years
      const totalExperienceYears = this.calculateTotalExperience(experience);

      const analysis: ResumeAnalysis = {
        id: uuidv4(),
        fileName: 'resume.pdf', // This will be updated by the calling service
        uploadedAt: new Date(),
        personalInfo,
        experience,
        education,
        skills,
        projects,
        seniorityLevel,
        careerSummary,
        totalExperienceYears
      };

      logger.info('Resume analysis completed successfully', {
        analysisId: analysis.id,
        experienceCount: experience.length,
        skillsCount: skills.technical.length + skills.languages.length + skills.frameworks.length,
        seniorityLevel,
        totalExperienceYears
      });

      return analysis;
    } catch (error) {
      logger.error('Resume analysis failed:', error);
      throw new Error(`Resume analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async extractSkills(content: string): Promise<SkillSet> {
    try {
      const prompt = `
Analyze the following resume content and extract all skills. Categorize them into technical skills, programming languages, frameworks, tools, and soft skills. For each technical skill, programming language, and framework, estimate the proficiency level (Beginner, Intermediate, Advanced) based on context clues like years of experience, project complexity, or explicit mentions.

Resume content:
${content}

Please respond with a JSON object in this exact format:
{
  "technical": [
    {
      "name": "skill name",
      "category": "category (e.g., Database, Cloud, DevOps)",
      "proficiencyLevel": "Beginner|Intermediate|Advanced",
      "yearsOfExperience": number or null
    }
  ],
  "languages": [
    {
      "name": "language name",
      "proficiencyLevel": "Beginner|Intermediate|Advanced",
      "yearsOfExperience": number or null
    }
  ],
  "frameworks": [
    {
      "name": "framework name",
      "category": "category (e.g., Web, Mobile, Backend)",
      "proficiencyLevel": "Beginner|Intermediate|Advanced",
      "yearsOfExperience": number or null
    }
  ],
  "tools": [
    {
      "name": "tool name",
      "category": "category (e.g., IDE, Version Control, Testing)",
      "proficiencyLevel": "Beginner|Intermediate|Advanced"
    }
  ],
  "soft": [
    {
      "name": "soft skill name",
      "description": "brief description if context available"
    }
  ]
}`;

      const response = await ollamaService.generateStructuredResponse<SkillSet>(prompt, this.model);
      
      // Validate and clean the response
      return this.validateAndCleanSkillSet(response);
    } catch (error) {
      logger.error('Skill extraction failed:', error);
      // Return empty skill set as fallback
      return {
        technical: [],
        soft: [],
        languages: [],
        frameworks: [],
        tools: []
      };
    }
  }

  public async determineSeniority(experience: ExperienceSection[]): Promise<SeniorityLevel> {
    try {
      if (experience.length === 0) {
        return 'Entry';
      }

      const totalYears = this.calculateTotalExperience(experience);
      const hasLeadershipExperience = experience.some(exp => 
        exp.position.toLowerCase().includes('lead') ||
        exp.position.toLowerCase().includes('senior') ||
        exp.position.toLowerCase().includes('principal') ||
        exp.position.toLowerCase().includes('manager') ||
        exp.responsibilities.some(resp => 
          resp.toLowerCase().includes('lead') ||
          resp.toLowerCase().includes('manage') ||
          resp.toLowerCase().includes('mentor')
        )
      );

      const prompt = `
Based on the following experience data, determine the appropriate seniority level:

Total years of experience: ${totalYears}
Has leadership experience: ${hasLeadershipExperience}

Experience details:
${experience.map(exp => `
Position: ${exp.position}
Company: ${exp.company}
Duration: ${exp.startDate} - ${exp.endDate || 'Present'}
Key responsibilities: ${exp.responsibilities.slice(0, 3).join(', ')}
`).join('\n')}

Please respond with one of these exact values: Entry, Junior, Mid, Senior, Lead, Principal

Consider:
- Entry: 0-1 years, entry-level positions
- Junior: 1-3 years, junior positions
- Mid: 3-5 years, mid-level positions with some independence
- Senior: 5-8 years, senior positions with significant responsibility
- Lead: 8+ years with leadership/mentoring responsibilities
- Principal: 10+ years with strategic/architectural responsibilities`;

      const response = await ollamaService.generate({
        model: this.model,
        prompt
      });
      const seniority = response.trim() as SeniorityLevel;

      // Validate the response
      const validLevels: SeniorityLevel[] = ['Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Principal'];
      if (validLevels.includes(seniority)) {
        return seniority;
      }

      // Fallback based on years of experience
      if (totalYears < 1) return 'Entry';
      if (totalYears < 3) return 'Junior';
      if (totalYears < 5) return 'Mid';
      if (totalYears < 8) return 'Senior';
      if (hasLeadershipExperience) return 'Lead';
      return 'Senior';

    } catch (error) {
      logger.error('Seniority determination failed:', error);
      // Fallback based on experience count and years
      const totalYears = this.calculateTotalExperience(experience);
      if (totalYears < 2) return 'Entry';
      if (totalYears < 5) return 'Junior';
      return 'Mid';
    }
  }

  private async extractPersonalInfo(content: string): Promise<PersonalInfo> {
    try {
      const prompt = `
Extract personal information from the following resume content:

${content}

Please respond with a JSON object in this exact format:
{
  "name": "full name or null",
  "email": "email address or null",
  "phone": "phone number or null",
  "location": "city, state/country or null",
  "linkedIn": "LinkedIn URL or null",
  "github": "GitHub URL or null",
  "website": "personal website URL or null"
}

Only include information that is explicitly mentioned in the resume.`;

      return await ollamaService.generateStructuredResponse<PersonalInfo>(prompt, this.model);
    } catch (error) {
      logger.error('Personal info extraction failed:', error);
      return {};
    }
  }

  private async extractExperience(content: string): Promise<ExperienceSection[]> {
    try {
      const prompt = `
Extract work experience from the following resume content:

${content}

Please respond with a JSON array in this exact format:
[
  {
    "id": "unique-id",
    "company": "company name",
    "position": "job title",
    "startDate": "start date (YYYY-MM or YYYY)",
    "endDate": "end date (YYYY-MM or YYYY) or null if current",
    "description": "brief job description",
    "responsibilities": ["responsibility 1", "responsibility 2"],
    "technologies": ["tech 1", "tech 2"] or null,
    "achievements": ["achievement 1", "achievement 2"] or null
  }
]

Extract all work experience entries. Generate unique IDs for each entry.`;

      const response = await ollamaService.generateStructuredResponse<ExperienceSection[]>(prompt, this.model);
      
      // Ensure response is an array and each experience has a unique ID
      if (!Array.isArray(response)) {
        logger.warn('Experience extraction returned non-array response, using empty array');
        return [];
      }
      
      return response.map(exp => ({
        ...exp,
        id: exp.id || uuidv4()
      }));
    } catch (error) {
      logger.error('Experience extraction failed:', error);
      return [];
    }
  }

  private async extractEducation(content: string): Promise<EducationSection[]> {
    try {
      const prompt = `
Extract education information from the following resume content:

${content}

Please respond with a JSON array in this exact format:
[
  {
    "id": "unique-id",
    "institution": "school/university name",
    "degree": "degree type (e.g., Bachelor's, Master's)",
    "field": "field of study",
    "startDate": "start date (YYYY-MM or YYYY)",
    "endDate": "end date (YYYY-MM or YYYY) or null if ongoing",
    "gpa": "GPA if mentioned or null",
    "honors": ["honor 1", "honor 2"] or null,
    "relevantCoursework": ["course 1", "course 2"] or null
  }
]

Extract all education entries. Generate unique IDs for each entry.`;

      const response = await ollamaService.generateStructuredResponse<EducationSection[]>(prompt, this.model);
      
      // Ensure response is an array and each education has a unique ID
      if (!Array.isArray(response)) {
        logger.warn('Education extraction returned non-array response, using empty array');
        return [];
      }
      
      return response.map(edu => ({
        ...edu,
        id: edu.id || uuidv4()
      }));
    } catch (error) {
      logger.error('Education extraction failed:', error);
      return [];
    }
  }

  private async extractProjects(content: string): Promise<ProjectSection[]> {
    try {
      const prompt = `
Extract project information from the following resume content:

${content}

Please respond with a JSON array in this exact format:
[
  {
    "id": "unique-id",
    "name": "project name",
    "description": "project description",
    "technologies": ["tech 1", "tech 2"],
    "startDate": "start date (YYYY-MM or YYYY) or null",
    "endDate": "end date (YYYY-MM or YYYY) or null",
    "url": "project URL or null",
    "github": "GitHub repository URL or null",
    "achievements": ["achievement 1", "achievement 2"] or null
  }
]

Extract all project entries. Generate unique IDs for each entry.`;

      const response = await ollamaService.generateStructuredResponse<ProjectSection[]>(prompt, this.model);
      
      // Ensure response is an array and each project has a unique ID
      if (!Array.isArray(response)) {
        logger.warn('Projects extraction returned non-array response, using empty array');
        return [];
      }
      
      return response.map(project => ({
        ...project,
        id: project.id || uuidv4()
      }));
    } catch (error) {
      logger.error('Projects extraction failed:', error);
      return [];
    }
  }

  private async generateCareerSummary(
    content: string, 
    experience: ExperienceSection[], 
    skills: SkillSet
  ): Promise<string> {
    try {
      const prompt = `
Based on the following resume information, generate a concise 2-3 sentence career summary:

Experience: ${experience.length} positions
Key skills: ${skills.languages.map(l => l.name).join(', ')}
Technical skills: ${skills.technical.map(t => t.name).slice(0, 5).join(', ')}

Recent experience:
${experience.slice(0, 2).map(exp => `${exp.position} at ${exp.company}`).join(', ')}

Generate a professional summary that highlights the person's expertise, experience level, and key strengths.`;

      const summary = await ollamaService.generate({
        model: this.model,
        prompt
      });
      return summary.trim();
    } catch (error) {
      logger.error('Career summary generation failed:', error);
      return 'Experienced professional with diverse technical skills and industry experience.';
    }
  }

  private calculateTotalExperience(experience: ExperienceSection[]): number {
    if (experience.length === 0) return 0;

    let totalMonths = 0;

    for (const exp of experience) {
      const startDate = new Date(exp.startDate + '-01');
      const endDate = exp.endDate ? new Date(exp.endDate + '-01') : new Date();
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
        totalMonths += Math.max(0, months);
      }
    }

    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
  }

  private validateAndCleanSkillSet(skillSet: any): SkillSet {
    const cleanSkillSet: SkillSet = {
      technical: [],
      soft: [],
      languages: [],
      frameworks: [],
      tools: []
    };

    // Validate technical skills
    if (Array.isArray(skillSet.technical)) {
      cleanSkillSet.technical = skillSet.technical
        .filter((skill: any) => skill && typeof skill.name === 'string')
        .map((skill: any) => ({
          name: skill.name,
          category: skill.category || 'General',
          proficiencyLevel: ['Beginner', 'Intermediate', 'Advanced'].includes(skill.proficiencyLevel) 
            ? skill.proficiencyLevel : 'Intermediate',
          yearsOfExperience: typeof skill.yearsOfExperience === 'number' ? skill.yearsOfExperience : undefined
        }));
    }

    // Validate programming languages
    if (Array.isArray(skillSet.languages)) {
      cleanSkillSet.languages = skillSet.languages
        .filter((lang: any) => lang && typeof lang.name === 'string')
        .map((lang: any) => ({
          name: lang.name,
          proficiencyLevel: ['Beginner', 'Intermediate', 'Advanced'].includes(lang.proficiencyLevel) 
            ? lang.proficiencyLevel : 'Intermediate',
          yearsOfExperience: typeof lang.yearsOfExperience === 'number' ? lang.yearsOfExperience : undefined
        }));
    }

    // Validate frameworks
    if (Array.isArray(skillSet.frameworks)) {
      cleanSkillSet.frameworks = skillSet.frameworks
        .filter((fw: any) => fw && typeof fw.name === 'string')
        .map((fw: any) => ({
          name: fw.name,
          category: fw.category || 'General',
          proficiencyLevel: ['Beginner', 'Intermediate', 'Advanced'].includes(fw.proficiencyLevel) 
            ? fw.proficiencyLevel : 'Intermediate',
          yearsOfExperience: typeof fw.yearsOfExperience === 'number' ? fw.yearsOfExperience : undefined
        }));
    }

    // Validate tools
    if (Array.isArray(skillSet.tools)) {
      cleanSkillSet.tools = skillSet.tools
        .filter((tool: any) => tool && typeof tool.name === 'string')
        .map((tool: any) => ({
          name: tool.name,
          category: tool.category || 'General',
          proficiencyLevel: ['Beginner', 'Intermediate', 'Advanced'].includes(tool.proficiencyLevel) 
            ? tool.proficiencyLevel : 'Intermediate'
        }));
    }

    // Validate soft skills
    if (Array.isArray(skillSet.soft)) {
      cleanSkillSet.soft = skillSet.soft
        .filter((skill: any) => skill && typeof skill.name === 'string')
        .map((skill: any) => ({
          name: skill.name,
          description: typeof skill.description === 'string' ? skill.description : undefined
        }));
    }

    return cleanSkillSet;
  }
}

export default new AIAnalysisServiceImpl();