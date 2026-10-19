import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { ServiceError } from '../services/production.service';

export class AuthController {
  private getCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'strict' : 'lax') as 'strict' | 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.cookie('autotrack_token', result.token, this.getCookieOptions());
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isProd = process.env.NODE_ENV === 'production';
      res.clearCookie('autotrack_token', {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? 'strict' : 'lax') as 'strict' | 'lax',
        path: '/',
      });
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.cookie('autotrack_token', result.token, this.getCookieOptions());
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated' });
        return;
      }
      const user = await authService.getCurrentUser(req.user.userId);
      res.status(200).json({ user });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  private handleError(error: unknown, res: Response, next: NextFunction): void {
    const err = error as any;
    if (error instanceof ServiceError || err?.name === 'ServiceError' || typeof err?.statusCode === 'number') {
      const statusCode = err?.statusCode || 400;
      const errorTitle =
        statusCode === 401
          ? 'Unauthorized'
          : statusCode === 403
          ? 'Forbidden'
          : statusCode === 404
          ? 'Not Found'
          : statusCode === 409
          ? 'Conflict'
          : 'Bad Request';

      res.status(statusCode).json({
        error: errorTitle,
        message: err?.message || 'Authentication error',
      });
      return;
    }

    console.error('[AuthController Error]:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected authentication error occurred.',
    });
  }
}

export const authController = new AuthController();
