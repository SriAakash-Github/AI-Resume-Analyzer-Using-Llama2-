import { v4 as uuidv4 } from 'uuid';
import {
  CareerGuidanceService,
  ResumeAnalysis,
  CareerRoadmap,
  SkillSet,
  SkillGap,
  LearningResource,
  RoadmapStep,
  DifficultyLevel
} from '../types';
import ollamaService from './ollamaService';
import logger from '../utils/logger';

class CareerGuidanceServiceImpl implements CareerGuidanceService {
  private readonly model: string;

  constructor() {
    this.model = process.env.OLLAMA_GUIDANCE_MODEL || 'llama2';
  }

  public async generateRoadmap(analysis: ResumeAnalysis): Promise<CareerRoadmap> {
    try {
      logger.info('Generating career roadmap', {
        analysisId: analysis.id,
        seniorityLevel: analysis.seniorityLevel,
        experienceYears: analysis.totalExperienceYears
      });

      // Identify skill gaps and target role
      const targetRole = await this.determineTargetRole(analysis);
      const skillGaps = await this.identifySkillGaps(analysis.skills, targetRole);
      const learningResources = await this.recommendResources(skillGaps);

      // Generate roadmap steps
      const roadmapSteps = await this.generateRoadmapSteps(analysis, skillGaps, targetRole);

      // Calculate timeline estimate
      const timelineEstimate = this.calculateTimelineEstimate(roadmapSteps);

      // Determine overall priority
      const overallPriority = this.determineOverallPriority(skillGaps, analysis.seniorityLevel);

      const roadmap: CareerRoadmap = {
        id: uuidv4(),
        currentLevel: analysis.seniorityLevel,
        targetRole,
        recommendedPath: roadmapSteps,
        skillGaps,
        timelineEstimate,
        overallPriority
      };

      logger.info('Career roadmap generated successfully', {
        roadmapId: roadmap.id,
        targetRole,
        skillGapsCount: skillGaps.length,
        stepsCount: roadmapSteps.length,
        timelineEstimate
      });

      return roadmap;
    } catch (error) {
      logger.error('Career roadmap generation failed:', error);
      throw new Error(`Career roadmap generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async identifySkillGaps(currentSkills: SkillSet, targetRole: string): Promise<SkillGap[]> {
    try {
      const currentSkillsContext = this.formatSkillsForAnalysis(currentSkills);

      const prompt = `
Analyze the current skills and identify gaps for the target role: ${targetRole}

Current Skills:
${currentSkillsContext}

Target Role: ${targetRole}

Based on current industry standards and job requirements for ${targetRole}, identify skill gaps and areas for improvement.

Please respond with a JSON array in this exact format:
[
  {
    "skill": "skill name",
    "currentLevel": "None|Beginner|Intermediate|Advanced",
    "targetLevel": "Beginner|Intermediate|Advanced",
    "priority": "High|Medium|Low",
    "estimatedLearningTime": "time estimate (e.g., '2-3 months', '6 months')"
  }
]

Consider:
1. Technical skills required for the target role
2. Current skill levels and experience
3. Industry trends and emerging technologies
4. Skills that would provide the most career impact
5. Realistic learning timelines based on complexity

Focus on the most important gaps that would significantly impact career progression.`;

      const skillGaps = await ollamaService.generateStructuredResponse<SkillGap[]>(prompt, this.model);
      
      return this.validateAndCleanSkillGaps(skillGaps);
    } catch (error) {
      logger.error('Skill gap identification failed:', error);
      return this.generateFallbackSkillGaps(targetRole);
    }
  }

  public async recommendResources(skillGaps: SkillGap[]): Promise<LearningResource[]> {
    try {
      if (skillGaps.length === 0) {
        return [];
      }

      const skillsToLearn = skillGaps
        .filter(gap => gap.priority === 'High' || gap.priority === 'Medium')
        .map(gap => `${gap.skill} (${gap.currentLevel} → ${gap.targetLevel})`)
        .join(', ');

      const prompt = `
Recommend learning resources for the following skills:
${skillsToLearn}

Please respond with a JSON array in this exact format:
[
  {
    "title": "resource title",
    "type": "Course|Book|Tutorial|Documentation|Practice",
    "url": "URL if available or null",
    "description": "brief description of the resource",
    "estimatedTime": "time to complete (e.g., '4 weeks', '20 hours')",
    "difficulty": "Beginner|Intermediate|Advanced"
  }
]

Prioritize:
1. High-quality, well-regarded resources
2. Practical, hands-on learning opportunities
3. Free or affordable options when possible
4. Resources that build upon each other logically
5. Mix of different learning types (courses, practice, documentation)

Include both foundational and advanced resources for each skill area.`;

      const resources = await ollamaService.generateStructuredResponse<LearningResource[]>(prompt, this.model);
      
      return this.validateAndCleanLearningResources(resources);
    } catch (error) {
      logger.error('Resource recommendation failed:', error);
      return this.generateFallbackResources(skillGaps);
    }
  }

  private async determineTargetRole(analysis: ResumeAnalysis): Promise<string> {
    try {
      const currentSkillsContext = this.formatSkillsForAnalysis(analysis.skills);
      const experienceContext = analysis.experience
        .slice(0, 2)
        .map(exp => `${exp.position} at ${exp.company}`)
        .join(', ');

      const prompt = `
Based on the following profile, suggest the most logical next career step/target role:

Current Level: ${analysis.seniorityLevel}
Experience: ${analysis.totalExperienceYears} years
Recent Positions: ${experienceContext}
Career Summary: ${analysis.careerSummary}

Key Skills:
${currentSkillsContext}

Suggest a specific target role title that represents a logical career progression. Consider:
1. Current seniority level and experience
2. Technical skills and expertise areas
3. Natural career progression paths
4. Industry standards and common role progressions

Respond with just the role title (e.g., "Senior Full Stack Developer", "Engineering Manager", "Principal Software Engineer").`;

      const targetRole = await ollamaService.generate({
        model: this.model,
        prompt
      });
      return targetRole.trim();
    } catch (error) {
      logger.error('Target role determination failed:', error);
      return this.getFallbackTargetRole(analysis.seniorityLevel);
    }
  }

  private async generateRoadmapSteps(
    analysis: ResumeAnalysis,
    skillGaps: SkillGap[],
    targetRole: string
  ): Promise<RoadmapStep[]> {
    try {
      const highPriorityGaps = skillGaps.filter(gap => gap.priority === 'High');
      const mediumPriorityGaps = skillGaps.filter(gap => gap.priority === 'Medium');

      const prompt = `
Create a step-by-step career roadmap for progressing from ${analysis.seniorityLevel} to ${targetRole}.

Current Profile:
- Experience: ${analysis.totalExperienceYears} years
- Current Level: ${analysis.seniorityLevel}
- Target Role: ${targetRole}

High Priority Skill Gaps: ${highPriorityGaps.map(g => g.skill).join(', ')}
Medium Priority Skill Gaps: ${mediumPriorityGaps.map(g => g.skill).join(', ')}

Please respond with a JSON array in this exact format:
[
  {
    "id": "step-1",
    "title": "Step title",
    "description": "Detailed description of what to accomplish in this step",
    "skills": ["skill1", "skill2"],
    "estimatedTime": "time estimate (e.g., '3 months', '6 months')",
    "priority": "High|Medium|Low",
    "resources": [],
    "prerequisites": ["previous step requirement"] or null
  }
]

Create 4-6 logical steps that:
1. Build upon each other progressively
2. Address the most critical skill gaps first
3. Include both technical and soft skill development
4. Are realistic and achievable
5. Lead toward the target role

Each step should be substantial enough to represent meaningful progress but not overwhelming.`;

      const steps = await ollamaService.generateStructuredResponse<RoadmapStep[]>(prompt, this.model);
      
      return this.validateAndCleanRoadmapSteps(steps);
    } catch (error) {
      logger.error('Roadmap steps generation failed:', error);
      return this.generateFallbackRoadmapSteps(analysis.seniorityLevel, targetRole);
    }
  }

  private formatSkillsForAnalysis(skills: SkillSet): string {
    const sections = [];

    if (skills.languages.length > 0) {
      sections.push(`Programming Languages: ${skills.languages.map(l => `${l.name} (${l.proficiencyLevel})`).join(', ')}`);
    }

    if (skills.frameworks.length > 0) {
      sections.push(`Frameworks: ${skills.frameworks.map(f => `${f.name} (${f.proficiencyLevel})`).join(', ')}`);
    }

    if (skills.technical.length > 0) {
      sections.push(`Technical Skills: ${skills.technical.map(t => `${t.name} (${t.proficiencyLevel})`).join(', ')}`);
    }

    if (skills.tools.length > 0) {
      sections.push(`Tools: ${skills.tools.map(t => `${t.name} (${t.proficiencyLevel})`).join(', ')}`);
    }

    if (skills.soft.length > 0) {
      sections.push(`Soft Skills: ${skills.soft.map(s => s.name).join(', ')}`);
    }

    return sections.join('\n');
  }

  private calculateTimelineEstimate(steps: RoadmapStep[]): string {
    if (steps.length === 0) return '6 months';

    // Extract time estimates and calculate total
    let totalMonths = 0;
    let hasValidEstimates = false;

    for (const step of steps) {
      const timeMatch = step.estimatedTime.match(/(\d+)\s*(month|week)/i);
      if (timeMatch) {
        const value = parseInt(timeMatch[1]);
        const unit = timeMatch[2].toLowerCase();
        
        if (unit.startsWith('month')) {
          totalMonths += value;
          hasValidEstimates = true;
        } else if (unit.startsWith('week')) {
          totalMonths += Math.ceil(value / 4);
          hasValidEstimates = true;
        }
      }
    }

    if (!hasValidEstimates) {
      return '6-12 months';
    }

    if (totalMonths <= 6) return `${totalMonths} months`;
    if (totalMonths <= 12) return `${totalMonths} months`;
    
    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;
    
    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    }
  }

  private determineOverallPriority(skillGaps: SkillGap[], currentLevel: string): 'High' | 'Medium' | 'Low' {
    const highPriorityGaps = skillGaps.filter(gap => gap.priority === 'High').length;
    const totalGaps = skillGaps.length;

    if (highPriorityGaps >= 3 || (totalGaps > 0 && highPriorityGaps / totalGaps > 0.5)) {
      return 'High';
    }

    if (currentLevel === 'Entry' || currentLevel === 'Junior') {
      return 'High'; // Early career development is high priority
    }

    return totalGaps > 2 ? 'Medium' : 'Low';
  }

  private validateAndCleanSkillGaps(skillGaps: any[]): SkillGap[] {
    if (!Array.isArray(skillGaps)) return [];

    return skillGaps
      .filter(gap => gap && typeof gap.skill === 'string')
      .map(gap => ({
        skill: gap.skill,
        currentLevel: ['None', 'Beginner', 'Intermediate', 'Advanced'].includes(gap.currentLevel) 
          ? gap.currentLevel : 'None',
        targetLevel: ['Beginner', 'Intermediate', 'Advanced'].includes(gap.targetLevel) 
          ? gap.targetLevel : 'Intermediate',
        priority: ['High', 'Medium', 'Low'].includes(gap.priority) ? gap.priority : 'Medium',
        estimatedLearningTime: gap.estimatedLearningTime || '3-6 months'
      }));
  }

  private validateAndCleanLearningResources(resources: any[]): LearningResource[] {
    if (!Array.isArray(resources)) return [];

    return resources
      .filter(resource => resource && typeof resource.title === 'string')
      .map(resource => ({
        title: resource.title,
        type: ['Course', 'Book', 'Tutorial', 'Documentation', 'Practice'].includes(resource.type) 
          ? resource.type : 'Course',
        url: resource.url || undefined,
        description: resource.description || '',
        estimatedTime: resource.estimatedTime || '4 weeks',
        difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(resource.difficulty) 
          ? resource.difficulty : 'Intermediate'
      }));
  }

  private validateAndCleanRoadmapSteps(steps: any[]): RoadmapStep[] {
    if (!Array.isArray(steps)) return [];

    return steps
      .filter(step => step && typeof step.title === 'string')
      .map(step => ({
        id: step.id || uuidv4(),
        title: step.title,
        description: step.description || '',
        skills: Array.isArray(step.skills) ? step.skills : [],
        estimatedTime: step.estimatedTime || '3 months',
        priority: ['High', 'Medium', 'Low'].includes(step.priority) ? step.priority : 'Medium',
        resources: Array.isArray(step.resources) ? step.resources : [],
        prerequisites: Array.isArray(step.prerequisites) ? step.prerequisites : undefined
      }));
  }

  private getFallbackTargetRole(currentLevel: string): string {
    const roleProgression: Record<string, string> = {
      'Entry': 'Junior Software Developer',
      'Junior': 'Software Developer',
      'Mid': 'Senior Software Developer',
      'Senior': 'Lead Software Engineer',
      'Lead': 'Principal Software Engineer',
      'Principal': 'Staff Software Engineer'
    };

    return roleProgression[currentLevel] || 'Senior Software Developer';
  }

  private generateFallbackSkillGaps(targetRole: string): SkillGap[] {
    const commonGaps: SkillGap[] = [
      {
        skill: 'System Design',
        currentLevel: 'Beginner',
        targetLevel: 'Intermediate',
        priority: 'High',
        estimatedLearningTime: '4-6 months'
      },
      {
        skill: 'Cloud Technologies',
        currentLevel: 'None',
        targetLevel: 'Intermediate',
        priority: 'High',
        estimatedLearningTime: '3-4 months'
      },
      {
        skill: 'Leadership Skills',
        currentLevel: 'Beginner',
        targetLevel: 'Intermediate',
        priority: 'Medium',
        estimatedLearningTime: '6 months'
      }
    ];

    return commonGaps;
  }

  private generateFallbackResources(skillGaps: SkillGap[]): LearningResource[] {
    return [
      {
        title: 'System Design Interview Course',
        type: 'Course',
        description: 'Comprehensive system design fundamentals',
        estimatedTime: '8 weeks',
        difficulty: 'Intermediate' as DifficultyLevel
      },
      {
        title: 'Cloud Computing Fundamentals',
        type: 'Course',
        description: 'Introduction to cloud platforms and services',
        estimatedTime: '6 weeks',
        difficulty: 'Beginner' as DifficultyLevel
      }
    ];
  }

  private generateFallbackRoadmapSteps(currentLevel: string, targetRole: string): RoadmapStep[] {
    return [
      {
        id: uuidv4(),
        title: 'Strengthen Core Technical Skills',
        description: 'Focus on mastering fundamental programming concepts and best practices',
        skills: ['Programming Fundamentals', 'Code Quality'],
        estimatedTime: '3 months',
        priority: 'High',
        resources: []
      },
      {
        id: uuidv4(),
        title: 'Learn Modern Technologies',
        description: 'Gain experience with current industry-standard tools and frameworks',
        skills: ['Modern Frameworks', 'Cloud Technologies'],
        estimatedTime: '4 months',
        priority: 'High',
        resources: []
      },
      {
        id: uuidv4(),
        title: 'Develop Leadership Skills',
        description: 'Build communication and mentoring capabilities',
        skills: ['Leadership', 'Communication'],
        estimatedTime: '6 months',
        priority: 'Medium',
        resources: []
      }
    ];
  }
}

export default new CareerGuidanceServiceImpl();