import { v4 as uuidv4 } from 'uuid';
import {
  QuestionGeneratorService,
  SkillSet,
  ExperienceSection,
  Question,
  DifficultyLevel
} from '../types';
import ollamaService from './ollamaService';
import logger from '../utils/logger';

class QuestionGeneratorServiceImpl implements QuestionGeneratorService {
  private readonly model: string;

  constructor() {
    this.model = process.env.OLLAMA_QUESTION_MODEL || 'llama2';
  }

  public async generateTechnicalQuestions(
    skills: SkillSet,
    count: number,
    difficulty: DifficultyLevel
  ): Promise<Question[]> {
    try {
      logger.info('Generating technical questions', { count, difficulty });

      // Prepare skills context
      const allTechnicalSkills = [
        ...skills.technical.map(s => ({ name: s.name, category: s.category, level: s.proficiencyLevel })),
        ...skills.languages.map(s => ({ name: s.name, category: 'Programming Language', level: s.proficiencyLevel })),
        ...skills.frameworks.map(s => ({ name: s.name, category: s.category, level: s.proficiencyLevel })),
        ...skills.tools.map(s => ({ name: s.name, category: s.category, level: s.proficiencyLevel }))
      ];

      if (allTechnicalSkills.length === 0) {
        logger.warn('No technical skills found, generating general programming questions');
        return this.generateGeneralTechnicalQuestions(count, difficulty);
      }

      // Group skills by category for better question distribution
      const skillsByCategory = this.groupSkillsByCategory(allTechnicalSkills);
      
      // Generate questions for each category
      const questionPromises = Object.entries(skillsByCategory).map(([category, categorySkills]) => {
        const categoryCount = Math.ceil(count * (categorySkills.length / allTechnicalSkills.length));
        return this.generateCategoryQuestions(category, categorySkills, categoryCount, difficulty);
      });

      const categoryQuestions = await Promise.all(questionPromises);
      const allQuestions = categoryQuestions.flat();

      // If we have more questions than requested, randomly select the requested count
      const finalQuestions = this.selectQuestions(allQuestions, count);

      logger.info('Technical questions generated successfully', {
        totalGenerated: allQuestions.length,
        finalCount: finalQuestions.length,
        categories: Object.keys(skillsByCategory)
      });

      return finalQuestions;
    } catch (error) {
      logger.error('Technical question generation failed:', error);
      throw new Error(`Technical question generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async generateBehavioralQuestions(
    experience: ExperienceSection[],
    count: number
  ): Promise<Question[]> {
    try {
      logger.info('Generating behavioral questions', { count, experienceCount: experience.length });

      if (experience.length === 0) {
        return this.generateGeneralBehavioralQuestions(count);
      }

      // Analyze experience for behavioral question context
      const experienceContext = this.analyzeExperienceForBehavioral(experience);

      const prompt = `
Based on the following professional experience, generate ${count} behavioral interview questions that are relevant to this person's background and career level.

Experience Context:
${experienceContext}

Generate questions that cover these areas:
- Leadership and teamwork (if applicable)
- Problem-solving and technical challenges
- Communication and collaboration
- Adaptability and learning
- Project management and delivery
- Conflict resolution
- Career growth and motivation

Please respond with a JSON array in this exact format:
[
  {
    "id": "unique-id",
    "type": "behavioral",
    "difficulty": "Intermediate",
    "question": "Tell me about a time when...",
    "category": "Leadership|Teamwork|Problem-solving|Communication|Adaptability|Project Management|Conflict Resolution|Career Growth",
    "suggestedAnswerFramework": "Use the STAR method (Situation, Task, Action, Result) to structure your answer...",
    "relatedSkills": ["skill1", "skill2"],
    "estimatedTime": "3-5 minutes"
  }
]

Make sure questions are:
1. Specific to their experience level and background
2. Open-ended and require detailed examples
3. Relevant to software engineering roles
4. Varied across different behavioral competencies
5. Appropriate for their seniority level`;

      const questions = await ollamaService.generateStructuredResponse<Question[]>(prompt, this.model);
      
      // Validate and clean questions
      const validatedQuestions = this.validateAndCleanQuestions(questions, 'behavioral');

      logger.info('Behavioral questions generated successfully', {
        generated: validatedQuestions.length
      });

      return validatedQuestions.slice(0, count);
    } catch (error) {
      logger.error('Behavioral question generation failed:', error);
      return this.generateGeneralBehavioralQuestions(count);
    }
  }

  private async generateCategoryQuestions(
    category: string,
    skills: Array<{ name: string; category: string; level: string }>,
    count: number,
    difficulty: DifficultyLevel
  ): Promise<Question[]> {
    if (count <= 0) return [];

    const skillNames = skills.map(s => s.name).join(', ');
    const skillLevels = skills.map(s => `${s.name} (${s.level})`).join(', ');

    const difficultyInstruction = this.getDifficultyInstruction(difficulty);

    const prompt = `
Generate ${count} technical interview questions for the ${category} category.

Skills to focus on: ${skillLevels}

${difficultyInstruction}

Please respond with a JSON array in this exact format:
[
  {
    "id": "unique-id",
    "type": "technical",
    "difficulty": "${difficulty === 'Mixed' ? 'Beginner|Intermediate|Advanced' : difficulty}",
    "question": "detailed technical question",
    "category": "${category}",
    "suggestedAnswerFramework": "Key points to cover in the answer...",
    "relatedSkills": ["${skills[0]?.name || 'skill1'}", "skill2"],
    "estimatedTime": "5-10 minutes"
  }
]

Requirements:
1. Questions should test practical knowledge and problem-solving
2. Include both conceptual and hands-on scenarios
3. Be specific to the mentioned skills
4. Vary in complexity based on difficulty level
5. Include real-world application scenarios`;

    try {
      const questions = await ollamaService.generateStructuredResponse<Question[]>(prompt, this.model);
      return this.validateAndCleanQuestions(questions, 'technical', difficulty);
    } catch (error) {
      logger.error(`Failed to generate questions for category ${category}:`, error);
      return [];
    }
  }

  private async generateGeneralTechnicalQuestions(count: number, difficulty: DifficultyLevel): Promise<Question[]> {
    const difficultyInstruction = this.getDifficultyInstruction(difficulty);

    const prompt = `
Generate ${count} general technical interview questions for software engineering roles.

${difficultyInstruction}

Cover these areas:
- Data structures and algorithms
- System design (if appropriate for level)
- Programming fundamentals
- Software engineering principles
- Problem-solving approaches
- Code quality and best practices

Please respond with a JSON array in this exact format:
[
  {
    "id": "unique-id",
    "type": "technical",
    "difficulty": "${difficulty === 'Mixed' ? 'Beginner|Intermediate|Advanced' : difficulty}",
    "question": "detailed technical question",
    "category": "General Programming",
    "suggestedAnswerFramework": "Key points to cover...",
    "relatedSkills": ["Programming", "Problem Solving"],
    "estimatedTime": "5-10 minutes"
  }
]`;

    try {
      const questions = await ollamaService.generateStructuredResponse<Question[]>(prompt, this.model);
      return this.validateAndCleanQuestions(questions, 'technical', difficulty);
    } catch (error) {
      logger.error('Failed to generate general technical questions:', error);
      return [];
    }
  }

  private async generateGeneralBehavioralQuestions(count: number): Promise<Question[]> {
    const prompt = `
Generate ${count} general behavioral interview questions suitable for software engineering roles.

Cover these competencies:
- Teamwork and collaboration
- Problem-solving and analytical thinking
- Communication skills
- Adaptability and learning
- Leadership potential
- Work ethic and motivation
- Handling pressure and deadlines

Please respond with a JSON array in this exact format:
[
  {
    "id": "unique-id",
    "type": "behavioral",
    "difficulty": "Intermediate",
    "question": "Tell me about a time when...",
    "category": "Teamwork|Problem-solving|Communication|Adaptability|Leadership|Work Ethic|Pressure Management",
    "suggestedAnswerFramework": "Use the STAR method (Situation, Task, Action, Result)...",
    "relatedSkills": ["Communication", "Problem Solving"],
    "estimatedTime": "3-5 minutes"
  }
]`;

    try {
      const questions = await ollamaService.generateStructuredResponse<Question[]>(prompt, this.model);
      return this.validateAndCleanQuestions(questions, 'behavioral');
    } catch (error) {
      logger.error('Failed to generate general behavioral questions:', error);
      return this.getFallbackBehavioralQuestions(count);
    }
  }

  private groupSkillsByCategory(skills: Array<{ name: string; category: string; level: string }>): Record<string, Array<{ name: string; category: string; level: string }>> {
    return skills.reduce((groups, skill) => {
      const category = skill.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(skill);
      return groups;
    }, {} as Record<string, Array<{ name: string; category: string; level: string }>>);
  }

  private analyzeExperienceForBehavioral(experience: ExperienceSection[]): string {
    const totalYears = this.calculateExperienceYears(experience);
    const hasLeadership = experience.some(exp => 
      exp.position.toLowerCase().includes('lead') ||
      exp.position.toLowerCase().includes('senior') ||
      exp.responsibilities.some(resp => 
        resp.toLowerCase().includes('lead') ||
        resp.toLowerCase().includes('manage') ||
        resp.toLowerCase().includes('mentor')
      )
    );

    const recentExperience = experience.slice(0, 2);
    const technologies = [...new Set(experience.flatMap(exp => exp.technologies || []))];

    return `
Total Experience: ${totalYears} years
Leadership Experience: ${hasLeadership ? 'Yes' : 'No'}
Recent Positions: ${recentExperience.map(exp => `${exp.position} at ${exp.company}`).join(', ')}
Key Technologies: ${technologies.slice(0, 8).join(', ')}
Company Types: ${experience.map(exp => exp.company).join(', ')}`;
  }

  private calculateExperienceYears(experience: ExperienceSection[]): number {
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

    return Math.round(totalMonths / 12 * 10) / 10;
  }

  private getDifficultyInstruction(difficulty: DifficultyLevel): string {
    switch (difficulty) {
      case 'Beginner':
        return `Focus on fundamental concepts and basic applications. Questions should be suitable for entry-level candidates with 0-2 years of experience.`;
      case 'Intermediate':
        return `Include practical scenarios and moderate complexity. Questions should be suitable for mid-level candidates with 2-5 years of experience.`;
      case 'Advanced':
        return `Focus on complex scenarios, system design, and advanced concepts. Questions should be suitable for senior candidates with 5+ years of experience.`;
      case 'Mixed':
        return `Generate questions across all difficulty levels (Beginner, Intermediate, Advanced) with roughly equal distribution.`;
      default:
        return `Generate questions at intermediate level.`;
    }
  }

  private selectQuestions(questions: Question[], targetCount: number): Question[] {
    if (questions.length <= targetCount) {
      return questions;
    }

    // Shuffle and select to ensure variety
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, targetCount);
  }

  private validateAndCleanQuestions(
    questions: any[], 
    type: 'technical' | 'behavioral',
    difficulty?: DifficultyLevel
  ): Question[] {
    if (!Array.isArray(questions)) {
      return [];
    }

    return questions
      .filter(q => q && typeof q.question === 'string' && q.question.trim().length > 0)
      .map(q => ({
        id: q.id || uuidv4(),
        type,
        difficulty: this.validateDifficulty(q.difficulty, difficulty),
        question: q.question.trim(),
        category: q.category || (type === 'technical' ? 'General Programming' : 'General'),
        suggestedAnswerFramework: q.suggestedAnswerFramework || this.getDefaultFramework(type),
        relatedSkills: Array.isArray(q.relatedSkills) ? q.relatedSkills : [],
        estimatedTime: q.estimatedTime || (type === 'technical' ? '5-10 minutes' : '3-5 minutes')
      }));
  }

  private validateDifficulty(questionDifficulty: any, targetDifficulty?: DifficultyLevel): DifficultyLevel {
    const validLevels: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
    
    if (validLevels.includes(questionDifficulty)) {
      return questionDifficulty;
    }
    
    if (targetDifficulty && targetDifficulty !== 'Mixed') {
      return targetDifficulty;
    }
    
    return 'Intermediate';
  }

  private getDefaultFramework(type: 'technical' | 'behavioral'): string {
    if (type === 'technical') {
      return 'Break down the problem, explain your approach, discuss trade-offs, and provide a clear solution with examples.';
    } else {
      return 'Use the STAR method: Situation (context), Task (what needed to be done), Action (what you did), Result (outcome and what you learned).';
    }
  }

  private getFallbackBehavioralQuestions(count: number): Question[] {
    const fallbackQuestions = [
      {
        question: "Tell me about a challenging project you worked on and how you overcame the difficulties.",
        category: "Problem-solving"
      },
      {
        question: "Describe a time when you had to work with a difficult team member. How did you handle it?",
        category: "Teamwork"
      },
      {
        question: "Give me an example of when you had to learn a new technology quickly for a project.",
        category: "Adaptability"
      },
      {
        question: "Tell me about a time when you disagreed with a technical decision. How did you handle it?",
        category: "Communication"
      },
      {
        question: "Describe a situation where you had to meet a tight deadline. How did you manage it?",
        category: "Pressure Management"
      }
    ];

    return fallbackQuestions.slice(0, count).map(q => ({
      id: uuidv4(),
      type: 'behavioral' as const,
      difficulty: 'Intermediate' as DifficultyLevel,
      question: q.question,
      category: q.category,
      suggestedAnswerFramework: this.getDefaultFramework('behavioral'),
      relatedSkills: ['Communication', 'Problem Solving'],
      estimatedTime: '3-5 minutes'
    }));
  }
}

export default new QuestionGeneratorServiceImpl();