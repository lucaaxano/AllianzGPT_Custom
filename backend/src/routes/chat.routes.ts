import { Router } from 'express';
import {
  getChatById,
  updateChat,
  deleteChat,
  addMessage,
  getMessages,
} from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/chats/:id - Get chat with messages
router.get('/:id', getChatById);

// PUT /api/chats/:id - Update chat
router.put('/:id', updateChat);

// DELETE /api/chats/:id - Delete chat
router.delete('/:id', deleteChat);

// GET /api/chats/:id/messages - Get messages
router.get('/:id/messages', getMessages);

// POST /api/chats/:id/messages - Add message
router.post('/:id/messages', addMessage);

export default router;
