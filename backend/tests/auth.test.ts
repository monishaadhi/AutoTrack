import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { userRepository } from '../src/repositories/user.repository';

describe('Authentication API (/api/auth)', () => {
  const mockPasswordHash = bcrypt.hashSync('Password@123', 10);
  const sampleAdminUser = {
    user_id: 1,
    username: 'admin',
    email: 'admin@autotrack.com',
    password_hash: mockPasswordHash,
    role: 'ADMIN' as const,
    first_name: 'System',
    last_name: 'Admin',
    is_active: 1,
    created_at: '2026-10-19 12:00:00',
    updated_at: '2026-10-19 12:00:00',
  };

  const sampleViewerUser = {
    user_id: 3,
    username: 'viewer',
    email: 'viewer@autotrack.com',
    password_hash: mockPasswordHash,
    role: 'VIEWER' as const,
    first_name: 'Plant',
    last_name: 'Viewer',
    is_active: 1,
    created_at: '2026-10-19 12:00:00',
    updated_at: '2026-10-19 12:00:00',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('authenticates valid credentials, sets HttpOnly cookie, and returns user data', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(sampleAdminUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@autotrack.com',
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('admin@autotrack.com');
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.token).toBeDefined();

      // Check HttpOnly cookie
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('autotrack_token=') && c.includes('HttpOnly'))).toBe(true);
    });

    it('rejects invalid password with 401 Unauthorized', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(sampleAdminUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@autotrack.com',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('rejects nonexistent user email with 401 Unauthorized', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@autotrack.com',
          password: 'Password@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('rejects malformed email with 400 Validation Error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Password@123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears the autotrack_token cookie and returns 200', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('autotrack_token=;') || c.includes('autotrack_token=Max-Age=0'))).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    const testSecret = process.env.JWT_SECRET || 'autotrack_default_jwt_secret_key_32_chars';
    const validToken = jwt.sign(
      { userId: 1, email: 'admin@autotrack.com', role: 'ADMIN' },
      testSecret
    );

    it('returns current user profile when authenticated with Bearer header', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdminUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('admin@autotrack.com');
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.body.user.password_hash).toBeUndefined();
    });

    it('returns current user profile when authenticated with HttpOnly cookie', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(sampleAdminUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`autotrack_token=${validToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('admin@autotrack.com');
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('returns 401 when no token or cookie is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('returns 401 when token is expired or invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('Registration Role Hardening', () => {
    it('prevents self-assignment of ADMIN role during registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'sneaky_admin',
          email: 'sneaky@autotrack.com',
          password: 'Password@123',
          role: 'ADMIN',
        });

      // Zod validation should reject 'ADMIN' role in register payload
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });
});
