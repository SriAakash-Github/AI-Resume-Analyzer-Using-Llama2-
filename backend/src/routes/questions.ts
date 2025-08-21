import { Router } from 'express';
import { 
  generateQuestions, 
  generateTechnicalQuestions, 
  generateBehavioralQuestions 
} from '../controllers/questionController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// POST /api/questions - Generate both technical and behavioral questions
router.post('/', asyncHandler(generateQuestions));

// POST /api/questions/technical - Generate technical questions only
router.post('/technical', asyncHandler(generateTechnicalQuestions));

// POST /api/questions/behavioral - Generate behavioral questions only
router.post('/behavioral', asyncHandler(generateBehavioralQuestions));

export default router;