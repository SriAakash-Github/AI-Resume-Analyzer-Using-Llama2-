import { Router } from 'express';
import { uploadResume, deleteFile, uploadMiddleware } from '../controllers/uploadController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// POST /api/upload - Upload resume file
router.post('/', uploadMiddleware, asyncHandler(uploadResume));

// DELETE /api/upload/:fileId - Delete uploaded file
router.delete('/:fileId', asyncHandler(deleteFile));

export default router;