import { Router } from 'express';
import uploadRoutes from './upload';
import analysisRoutes from './analysis';
import questionRoutes from './questions';
import guidanceRoutes from './guidance';
import healthRoutes from './health';

const router = Router();

// Mount route modules
router.use('/upload', uploadRoutes);
router.use('/analysis', analysisRoutes);
router.use('/questions', questionRoutes);
router.use('/guidance', guidanceRoutes);
router.use('/health', healthRoutes);

export default router;