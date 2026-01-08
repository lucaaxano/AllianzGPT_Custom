import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { createError } from '../middleware/error.middleware';
import { v4 as uuidv4 } from 'uuid';

export const verifyPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password } = req.body;

    if (!password) {
      return next(createError('Password is required', 400));
    }

    if (password !== config.auth.accessPassword) {
      return next(createError('Invalid password', 401));
    }

    // Generate a simple session token
    const token = uuidv4();

    res.json({
      success: true,
      data: { token },
      message: 'Authentication successful',
    });
  } catch (error) {
    next(error);
  }
};

export const checkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // If this endpoint is reached, auth middleware passed
    res.json({
      success: true,
      authenticated: true,
    });
  } catch (error) {
    next(error);
  }
};
