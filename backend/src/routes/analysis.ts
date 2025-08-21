import { Router } from 'express';
import { analyzeResume, getAnalysis } from '../controllers/analysisController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// POST /api/analysis - Analyze uploaded resume
router.post('/', asyncHandler(analyzeResume));

// GET /api/analysis/:analysisId - Get analysis by ID (not implemented - no persistence)
router.get('/:analysisId', asyncHandler(getAnalysis));

export default router;