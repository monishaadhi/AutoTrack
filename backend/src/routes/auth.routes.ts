import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth.middleware';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

// POST /api/auth/login - User credential authentication
router.post('/login', validateRequest(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

// POST /api/auth/register - User registration
router.post('/register', validateRequest(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

// POST /api/auth/logout - Terminate session & clear cookies
router.post('/logout', (req, res, next) =>
  authController.logout(req, res, next)
);

// GET /api/auth/me - Retrieve authenticated user profile
router.get('/me', authenticateToken, (req, res, next) =>
  authController.getMe(req, res, next)
);

export default router;
