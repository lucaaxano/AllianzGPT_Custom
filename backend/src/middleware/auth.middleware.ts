import { Request, Response, NextFunction } from 'express';
import { createError } from './error.middleware';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(createError('Authorization header required', 401));
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token || token === 'undefined') {
    return next(createError('Invalid token', 401));
  }

  // For this simple implementation, we just check if a token exists
  // In production, you might want to use JWT or similar
  next();
};
