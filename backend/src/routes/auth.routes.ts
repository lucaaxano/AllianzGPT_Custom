import { Router } from 'express';
import { verifyPassword, checkAuth } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/verify - Verify password
router.post('/verify', verifyPassword);

// GET /api/auth/check - Check if authenticated
router.get('/check', authMiddleware, checkAuth);

export default router;
