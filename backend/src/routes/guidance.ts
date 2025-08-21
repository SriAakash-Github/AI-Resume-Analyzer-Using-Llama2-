import { Router } from 'express';
import { 
  generateGuidance, 
  identifySkillGaps, 
  recommendResources 
} from '../controllers/guidanceController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// POST /api/guidance - Generate complete career guidance
router.post('/', asyncHandler(generateGuidance));

// POST /api/guidance/skill-gaps - Identify skill gaps for target role
router.post('/skill-gaps', asyncHandler(identifySkillGaps));

// POST /api/guidance/resources - Recommend learning resources
router.post('/resources', asyncHandler(recommendResources));

export default router;