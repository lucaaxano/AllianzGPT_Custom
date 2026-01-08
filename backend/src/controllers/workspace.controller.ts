import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export const getAllWorkspaces = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { chats: true },
        },
      },
    });

    res.json({
      success: true,
      data: workspaces,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        chats: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!workspace) {
      return next(createError('Workspace not found', 404));
    }

    res.json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

export const createWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return next(createError('Workspace name is required', 400));
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
      },
    });

    res.status(201).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return next(createError('Workspace name is required', 400));
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        name: name.trim(),
      },
    });

    res.json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Delete all messages in chats, then chats, then workspace
    await prisma.$transaction(async (tx) => {
      // Get all chat IDs for this workspace
      const chats = await tx.chat.findMany({
        where: { workspaceId: id },
        select: { id: true },
      });

      const chatIds = chats.map((c) => c.id);

      // Delete all messages
      await tx.message.deleteMany({
        where: { chatId: { in: chatIds } },
      });

      // Delete all chats
      await tx.chat.deleteMany({
        where: { workspaceId: id },
      });

      // Delete workspace
      await tx.workspace.delete({
        where: { id },
      });
    });

    res.json({
      success: true,
      message: 'Workspace deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const chats = await prisma.chat.findMany({
      where: { workspaceId: id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: chats,
    });
  } catch (error) {
    next(error);
  }
};

export const createChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: workspaceId } = req.params;
    const { title } = req.body;

    // Verify workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return next(createError('Workspace not found', 404));
    }

    const chat = await prisma.chat.create({
      data: {
        title: title || 'Neuer Chat',
        workspaceId,
      },
    });

    res.status(201).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};
