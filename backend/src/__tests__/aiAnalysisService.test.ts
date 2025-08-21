import aiAnalysisService from '../services/aiAnalysisService';
import ollamaService from '../services/ollamaService';
import { ExtractedContent, ExperienceSection, SkillSet } from '../types';

// Mock the ollama service
jest.mock('../services/ollamaService', () => ({
  generateStructuredResponse: jest.fn(),
  generate: jest.fn()
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

const mockOllamaService = ollamaService as jest.Mocked<typeof ollamaService>;

describe('AIAnalysisService', () => {
  const mockExtractedContent: ExtractedContent = {
    text: `John Doe
Software Engineer
john.doe@email.com
(555) 123-4567

EXPERIENCE
Senior Software Engineer at Tech Corp
2020 - Present
- Developed web applications using React and Node.js
- Led a team of 5 developers
- Implemented CI/CD pipelines

Software Engineer at StartupCo
2018 - 2020
- Built REST APIs using Python and Django
- Worked with PostgreSQL databases

EDUCATION
Bachelor of Computer Science
University of Technology
2014 - 2018
GPA: 3.8

SKILLS
JavaScript, Python, React, Node.js, Django, PostgreSQL, AWS, Docker

PROJECTS
E-commerce Platform
- Built using React and Node.js
- Integrated payment processing
- Deployed on AWS`,
    structure: {
      sections: {
        experience: { startIndex: 0, endIndex: 10, content: 'experience content' },
        education: { startIndex: 11, endIndex: 15, content: 'education content' },
        skills: { startIndex: 16, endIndex: 20, content: 'skills content' }
      },
      detectedSections: ['experience', 'education', 'skills']
    },
    metadata: {
      pageCount: 1,
      fileSize: 1024,
      extractionMethod: 'text'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeResume', () => {
    it('should successfully analyze a complete resume', async () => {
      // Mock all the extraction methods
      mockOllamaService.generateStructuredResponse
        .mockResolvedValueOnce({ // Personal info
          name: 'John Doe',
          email: 'john.doe@email.com',
          phone: '(555) 123-4567'
        })
        .mockResolvedValueOnce({ // Skills
          technical: [{ name: 'AWS', category: 'Cloud', proficiencyLevel: 'Intermediate' }],
          languages: [{ name: 'JavaScript', proficiencyLevel: 'Advanced' }],
          frameworks: [{ name: 'React', category: 'Frontend', proficiencyLevel: 'Advanced' }],
          tools: [{ name: 'Docker', category: 'DevOps', proficiencyLevel: 'Intermediate' }],
          soft: [{ name: 'Leadership', description: 'Team leadership experience' }]
        })
        .mockResolvedValueOnce([ // Experience
          {
            id: 'exp-1',
            company: 'Tech Corp',
            position: 'Senior Software Engineer',
            startDate: '2020-01',
            endDate: null,
            description: 'Senior developer role',
            responsibilities: ['Developed web applications', 'Led team'],
            technologies: ['React', 'Node.js'],
            achievements: ['Improved performance by 50%']
          }
        ])
        .mockResolvedValueOnce([ // Education
          {
            id: 'edu-1',
            institution: 'University of Technology',
            degree: 'Bachelor of Computer Science',
            field: 'Computer Science',
            startDate: '2014-09',
            endDate: '2018-05',
            gpa: '3.8'
          }
        ])
        .mockResolvedValueOnce([ // Projects
          {
            id: 'proj-1',
            name: 'E-commerce Platform',
            description: 'Full-stack e-commerce solution',
            technologies: ['React', 'Node.js', 'AWS'],
            url: 'https://example.com'
          }
        ]);

      mockOllamaService.generate
        .mockResolvedValueOnce('Senior') // Seniority level
        .mockResolvedValueOnce('Experienced senior software engineer with expertise in full-stack development and team leadership.'); // Career summary

      const result = await aiAnalysisService.analyzeResume(mockExtractedContent);

      expect(result).toBeDefined();
      expect(result.id).toBe('mock-uuid-123');
      expect(result.personalInfo.name).toBe('John Doe');
      expect(result.seniorityLevel).toBe('Senior');
      expect(result.experience).toHaveLength(1);
      expect(result.education).toHaveLength(1);
      expect(result.projects).toHaveLength(1);
      expect(result.skills.languages).toHaveLength(1);
      expect(result.totalExperienceYears).toBeGreaterThan(0);
    });

    it('should handle analysis failures gracefully', async () => {
      mockOllamaService.generateStructuredResponse.mockRejectedValue(new Error('AI service error'));
      mockOllamaService.generate.mockRejectedValue(new Error('AI service error'));

      await expect(aiAnalysisService.analyzeResume(mockExtractedContent))
        .rejects.toThrow('Resume analysis failed');
    });
  });

  describe('extractSkills', () => {
    it('should extract and validate skills correctly', async () => {
      const mockSkillSet: SkillSet = {
        technical: [
          { name: 'AWS', category: 'Cloud', proficiencyLevel: 'Intermediate', yearsOfExperience: 3 }
        ],
        languages: [
          { name: 'JavaScript', proficiencyLevel: 'Advanced', yearsOfExperience: 5 }
        ],
        frameworks: [
          { name: 'React', category: 'Frontend', proficiencyLevel: 'Advanced', yearsOfExperience: 4 }
        ],
        tools: [
          { name: 'Docker', category: 'DevOps', proficiencyLevel: 'Intermediate' }
        ],
        soft: [
          { name: 'Leadership', description: 'Team leadership experience' }
        ]
      };

      mockOllamaService.generateStructuredResponse.mockResolvedValue(mockSkillSet);

      const result = await aiAnalysisService.extractSkills('test content');

      expect(result).toEqual(mockSkillSet);
      expect(mockOllamaService.generateStructuredResponse).toHaveBeenCalledWith(
        expect.stringContaining('extract all skills'),
        expect.any(String)
      );
    });

    it('should return empty skill set on extraction failure', async () => {
      mockOllamaService.generateStructuredResponse.mockRejectedValue(new Error('Extraction failed'));

      const result = await aiAnalysisService.extractSkills('test content');

      expect(result).toEqual({
        technical: [],
        soft: [],
        languages: [],
        frameworks: [],
        tools: []
      });
    });

    it('should validate and clean malformed skill data', async () => {
      const malformedSkillSet = {
        technical: [
          { name: 'AWS', category: 'Cloud', proficiencyLevel: 'InvalidLevel' }, // Invalid proficiency
          { name: '', category: 'Cloud', proficiencyLevel: 'Intermediate' }, // Empty name
          { name: 'Docker', category: 'DevOps', proficiencyLevel: 'Advanced' } // Valid
        ],
        languages: [
          { name: 'JavaScript', proficiencyLevel: 'Advanced' }
        ],
        frameworks: [],
        tools: [],
        soft: [
          { name: 'Leadership' }
        ]
      };

      mockOllamaService.generateStructuredResponse.mockResolvedValue(malformedSkillSet);

      const result = await aiAnalysisService.extractSkills('test content');

      expect(result.technical).toHaveLength(2); // Should filter out empty name
      expect(result.technical[0].proficiencyLevel).toBe('Intermediate'); // Should default invalid level
      expect(result.technical[1].name).toBe('Docker');
      expect(result.languages).toHaveLength(1);
      expect(result.soft).toHaveLength(1);
    });
  });

  describe('determineSeniority', () => {
    it('should determine seniority based on experience', async () => {
      const mockExperience: ExperienceSection[] = [
        {
          id: '1',
          company: 'Tech Corp',
          position: 'Senior Software Engineer',
          startDate: '2020-01',
          endDate: null,
          description: 'Senior role',
          responsibilities: ['Led team of 5 developers', 'Architected solutions'],
          technologies: ['React', 'Node.js']
        },
        {
          id: '2',
          company: 'StartupCo',
          position: 'Software Engineer',
          startDate: '2018-01',
          endDate: '2020-01',
          description: 'Developer role',
          responsibilities: ['Built APIs', 'Worked with databases'],
          technologies: ['Python', 'Django']
        }
      ];

      mockOllamaService.generate.mockResolvedValue('Senior');

      const result = await aiAnalysisService.determineSeniority(mockExperience);

      expect(result).toBe('Senior');
      expect(mockOllamaService.generate).toHaveBeenCalledWith(
        expect.stringContaining('determine the appropriate seniority level'),
        expect.any(String)
      );
    });

    it('should return Entry for no experience', async () => {
      const result = await aiAnalysisService.determineSeniority([]);

      expect(result).toBe('Entry');
    });

    it('should fallback to experience-based calculation on AI failure', async () => {
      const mockExperience: ExperienceSection[] = [
        {
          id: '1',
          company: 'Company',
          position: 'Developer',
          startDate: '2022-01',
          endDate: null,
          description: 'Junior role',
          responsibilities: ['Basic development'],
          technologies: ['JavaScript']
        }
      ];

      mockOllamaService.generate.mockRejectedValue(new Error('AI failed'));

      const result = await aiAnalysisService.determineSeniority(mockExperience);

      expect(['Entry', 'Junior', 'Mid']).toContain(result);
    });

    it('should handle invalid AI responses', async () => {
      const mockExperience: ExperienceSection[] = [
        {
          id: '1',
          company: 'Company',
          position: 'Senior Developer',
          startDate: '2015-01',
          endDate: null,
          description: 'Senior role',
          responsibilities: ['Led projects'],
          technologies: ['JavaScript']
        }
      ];

      mockOllamaService.generate.mockResolvedValue('InvalidLevel');

      const result = await aiAnalysisService.determineSeniority(mockExperience);

      expect(['Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Principal']).toContain(result);
    });
  });

  describe('experience calculation', () => {
    it('should calculate total experience correctly', async () => {
      const mockExperience: ExperienceSection[] = [
        {
          id: '1',
          company: 'Current Company',
          position: 'Senior Engineer',
          startDate: '2020-01',
          endDate: null, // Current job
          description: 'Current role',
          responsibilities: ['Development'],
          technologies: ['React']
        },
        {
          id: '2',
          company: 'Previous Company',
          position: 'Engineer',
          startDate: '2018-01',
          endDate: '2020-01',
          description: 'Previous role',
          responsibilities: ['Development'],
          technologies: ['Vue']
        }
      ];

      // Mock the analysis to get the total experience calculation
      mockOllamaService.generateStructuredResponse
        .mockResolvedValueOnce({}) // Personal info
        .mockResolvedValueOnce({ technical: [], languages: [], frameworks: [], tools: [], soft: [] }) // Skills
        .mockResolvedValueOnce(mockExperience) // Experience
        .mockResolvedValueOnce([]) // Education
        .mockResolvedValueOnce([]); // Projects

      mockOllamaService.generate
        .mockResolvedValueOnce('Senior') // Seniority
        .mockResolvedValueOnce('Career summary'); // Summary

      const result = await aiAnalysisService.analyzeResume(mockExtractedContent);

      expect(result.totalExperienceYears).toBeGreaterThan(4); // Should be around 6+ years
    });
  });
});