import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { lineRepository } from '../src/repositories/line.repository';

describe('Production Lines API (/api/lines)', () => {
  const sampleLine = {
    line_id: 1,
    factory_id: 1,
    factory_name: 'Chennai Assembly Plant',
    factory_location: 'Chennai, Tamil Nadu',
    name: 'Assembly Line A',
    status: 'RUNNING' as const,
    created_at: '2026-10-18 15:49:13',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/lines', () => {
    it('returns list of production lines with factory information', async () => {
      vi.spyOn(lineRepository, 'findMany').mockResolvedValue([sampleLine]);

      const res = await request(app).get('/api/lines');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].factory_name).toBe('Chennai Assembly Plant');
      expect(res.body.data[0].status).toBe('RUNNING');
    });

    it('filters lines by factoryId and status', async () => {
      const spy = vi.spyOn(lineRepository, 'findMany').mockResolvedValue([sampleLine]);

      const res = await request(app).get('/api/lines?factoryId=1&status=RUNNING');

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith({ factoryId: 1, status: 'RUNNING' });
    });

    it('rejects invalid factoryId with 400', async () => {
      const res = await request(app).get('/api/lines?factoryId=invalid');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('rejects invalid status with 400', async () => {
      const res = await request(app).get('/api/lines?status=UNKNOWN');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/lines/:id', () => {
    it('returns 200 with line details when found', async () => {
      vi.spyOn(lineRepository, 'findById').mockResolvedValue(sampleLine);

      const res = await request(app).get('/api/lines/1');

      expect(res.status).toBe(200);
      expect(res.body.line_id).toBe(1);
      expect(res.body.name).toBe('Assembly Line A');
      expect(res.body.factory_location).toBe('Chennai, Tamil Nadu');
    });

    it('returns 404 when line is not found', async () => {
      vi.spyOn(lineRepository, 'findById').mockResolvedValue(null);

      const res = await request(app).get('/api/lines/999');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });

    it('returns 400 when line ID is non-numeric', async () => {
      const res = await request(app).get('/api/lines/abc');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });
});
