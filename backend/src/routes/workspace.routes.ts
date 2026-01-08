import { Router } from 'express';
import {
  getAllWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceChats,
  createChat,
} from '../controllers/workspace.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/workspaces - Get all workspaces
router.get('/', getAllWorkspaces);

// POST /api/workspaces - Create workspace
router.post('/', createWorkspace);

// GET /api/workspaces/:id - Get single workspace
router.get('/:id', getWorkspaceById);

// PUT /api/workspaces/:id - Update workspace
router.put('/:id', updateWorkspace);

// DELETE /api/workspaces/:id - Delete workspace
router.delete('/:id', deleteWorkspace);

// GET /api/workspaces/:id/chats - Get workspace chats
router.get('/:id/chats', getWorkspaceChats);

// POST /api/workspaces/:id/chats - Create chat in workspace
router.post('/:id/chats', createChat);

export default router;
