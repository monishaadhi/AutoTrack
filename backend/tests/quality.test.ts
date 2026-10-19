import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { qualityRepository } from '../src/repositories/quality.repository';

const testSecret = process.env.JWT_SECRET || 'autotrack_default_jwt_secret_key_32_chars';
const adminToken = jwt.sign({ userId: 1, email: 'admin@autotrack.com', role: 'ADMIN' }, testSecret);
const viewerToken = jwt.sign({ userId: 3, email: 'viewer@autotrack.com', role: 'VIEWER' }, testSecret);

describe('Quality Issues API (/api/quality-issues)', () => {
  const sampleIssue = {
    issue_id: 1,
    record_id: 1,
    line_id: 1,
    line_name: 'Assembly Line A',
    factory_id: 1,
    factory_name: 'Chennai Assembly Plant',
    production_date: '2026-10-15',
    shift: 'MORNING',
    category: 'ASSEMBLY' as const,
    severity: 'MEDIUM' as const,
    status: 'OPEN' as const,
    description: 'Fastener alignment requires inspection',
    created_at: '2026-10-18 15:49:29',
    updated_at: '2026-10-18 15:49:29',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/quality-issues', () => {
    it('returns paginated list of quality issues with joined line details', async () => {
      vi.spyOn(qualityRepository, 'findMany').mockResolvedValue({
        rows: [sampleIssue],
        total: 1,
      });

      const res = await request(app).get('/api/quality-issues?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      expect(res.body.data[0].category).toBe('ASSEMBLY');
      expect(res.body.data[0].line_name).toBe('Assembly Line A');
    });

    it('filters quality issues by status, severity, and category', async () => {
      const spy = vi.spyOn(qualityRepository, 'findMany').mockResolvedValue({
        rows: [sampleIssue],
        total: 1,
      });

      const res = await request(app).get(
        '/api/quality-issues?status=open&severity=medium&category=assembly'
      );

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'OPEN',
          severity: 'MEDIUM',
          category: 'ASSEMBLY',
        })
      );
    });

    it('rejects invalid status filter with 400', async () => {
      const res = await request(app).get('/api/quality-issues?status=INVALID_STATUS');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/quality-issues/:id', () => {
    it('returns 200 with issue details when found', async () => {
      vi.spyOn(qualityRepository, 'findById').mockResolvedValue(sampleIssue);

      const res = await request(app).get('/api/quality-issues/1');

      expect(res.status).toBe(200);
      expect(res.body.issue_id).toBe(1);
      expect(res.body.severity).toBe('MEDIUM');
      expect(res.body.status).toBe('OPEN');
    });

    it('returns 404 when issue is not found', async () => {
      vi.spyOn(qualityRepository, 'findById').mockResolvedValue(null);

      const res = await request(app).get('/api/quality-issues/999');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });

    it('returns 400 when issue ID is non-numeric', async () => {
      const res = await request(app).get('/api/quality-issues/xyz');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('PATCH /api/quality-issues/:id/status', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .patch('/api/quality-issues/1/status')
        .send({ status: 'RESOLVED' });
      expect(res.status).toBe(401);
    });

    it('rejects VIEWER role with 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/quality-issues/1/status')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ status: 'RESOLVED' });
      expect(res.status).toBe(403);
    });

    it('updates status and returns updated issue record', async () => {
      vi.spyOn(qualityRepository, 'findById')
        .mockResolvedValueOnce(sampleIssue) // initial check
        .mockResolvedValueOnce({ ...sampleIssue, status: 'RESOLVED' }); // after update
      vi.spyOn(qualityRepository, 'updateStatus').mockResolvedValue(true);

      const res = await request(app)
        .patch('/api/quality-issues/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('RESOLVED');
    });

    it('accepts lowercase or mixed-case status and normalizes it', async () => {
      vi.spyOn(qualityRepository, 'findById')
        .mockResolvedValueOnce(sampleIssue)
        .mockResolvedValueOnce({ ...sampleIssue, status: 'IN_REVIEW' });
      const spy = vi.spyOn(qualityRepository, 'updateStatus').mockResolvedValue(true);

      const res = await request(app)
        .patch('/api/quality-issues/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'in review' });

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith(1, 'IN_REVIEW');
    });

    it('returns 404 if issue does not exist', async () => {
      vi.spyOn(qualityRepository, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/quality-issues/999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });

    it('rejects invalid status values with 400', async () => {
      const res = await request(app)
        .patch('/api/quality-issues/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CLOSED' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });
});
