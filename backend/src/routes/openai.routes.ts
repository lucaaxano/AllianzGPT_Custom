import { Router } from 'express';
import {
  chatCompletion,
  generateImage,
  analyzeImage,
} from '../controllers/openai.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/chat/completions - Chat with OpenAI (streaming)
router.post('/chat/completions', chatCompletion);

// POST /api/images/generate - Generate image with DALL-E
router.post('/images/generate', generateImage);

// POST /api/images/analyze - Analyze image with Vision
router.post('/images/analyze', analyzeImage);

export default router;
