import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export const getChatById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!chat) {
      return next(createError('Chat not found', 404));
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};

export const updateChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const chat = await prisma.chat.update({
      where: { id },
      data: {
        title: title || 'Neuer Chat',
      },
    });

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      // Delete all messages first
      await tx.message.deleteMany({
        where: { chatId: id },
      });

      // Delete chat
      await tx.chat.delete({
        where: { id },
      });
    });

    res.json({
      success: true,
      message: 'Chat deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const addMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: chatId } = req.params;
    const { role, content } = req.body;

    if (!role || !content) {
      return next(createError('Role and content are required', 400));
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return next(createError('Invalid role', 400));
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        role,
        content,
      },
    });

    // Update chat's updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: chatId } = req.params;

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};
