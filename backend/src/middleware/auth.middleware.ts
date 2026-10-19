import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload, UserRole } from '../types/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'autotrack_default_jwt_secret_key_32_chars';
};

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined;

  // 1. Check HttpOnly cookie first
  if (req.cookies && req.cookies.autotrack_token) {
    token = req.cookies.autotrack_token;
  }

  // 2. Fallback to Authorization: Bearer <token>
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication session or token is required to access this resource.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication session. Please log in again.',
    });
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication is required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};
