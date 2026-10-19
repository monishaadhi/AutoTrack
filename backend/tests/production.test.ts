import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { productionRepository } from '../src/repositories/production.repository';

const testSecret = process.env.JWT_SECRET || 'autotrack_default_jwt_secret_key_32_chars';
const adminToken = jwt.sign({ userId: 1, email: 'admin@autotrack.com', role: 'ADMIN' }, testSecret);
const viewerToken = jwt.sign({ userId: 3, email: 'viewer@autotrack.com', role: 'VIEWER' }, testSecret);

describe('Production Records API (/api/production)', () => {
  const sampleRecord = {
    record_id: 1,
    line_id: 1,
    line_name: 'Body Framing & Stamping Line A',
    factory_id: 1,
    factory_name: 'Apex Assembly Complex',
    production_date: '2026-10-18',
    shift: 'MORNING' as const,
    target_quantity: 360,
    produced_quantity: 342,
    defect_count: 6,
    downtime_minutes: 15,
    created_at: '2026-10-18 08:00:00',
    updated_at: '2026-10-18 08:00:00',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/production', () => {
    it('returns paginated list of production records with enriched metrics', async () => {
      vi.spyOn(productionRepository, 'findMany').mockResolvedValue({
        rows: [sampleRecord],
        total: 1,
      });

      const res = await request(app).get('/api/production?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      // Check enriched calculations
      const item = res.body.data[0];
      expect(item.achievement_rate).toBe(95.0); // (342/360)*100
      expect(item.scrap_rate).toBe(1.72); // (6/(342+6))*100
      expect(item.yield_rate).toBe(98.28);
    });

    it('rejects invalid pagination parameters with 400', async () => {
      const res = await request(app).get('/api/production?page=-2');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('rejects invalid date format in filter with 400', async () => {
      const res = await request(app).get('/api/production?startDate=18-10-2026');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/production/:id', () => {
    it('returns 200 with record details when found', async () => {
      vi.spyOn(productionRepository, 'findById').mockResolvedValue(sampleRecord);

      const res = await request(app).get('/api/production/1');

      expect(res.status).toBe(200);
      expect(res.body.record_id).toBe(1);
      expect(res.body.achievement_rate).toBe(95.0);
    });

    it('returns 404 when record does not exist', async () => {
      vi.spyOn(productionRepository, 'findById').mockResolvedValue(null);

      const res = await request(app).get('/api/production/9999');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });

    it('returns 400 when record ID is non-numeric', async () => {
      const res = await request(app).get('/api/production/abc');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/production', () => {
    const validPayload = {
      line_id: 1,
      production_date: '2026-10-19',
      shift: 'Morning',
      target_quantity: 360,
      produced_quantity: 350,
      defect_count: 4,
      downtime_minutes: 10,
    };

    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/production').send(validPayload);
      expect(res.status).toBe(401);
    });

    it('rejects VIEWER role with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/production')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(validPayload);
      expect(res.status).toBe(403);
    });

    it('creates a new production record and returns 201', async () => {
      vi.spyOn(productionRepository, 'lineExists').mockResolvedValue(true);
      vi.spyOn(productionRepository, 'findByLineDateShift').mockResolvedValue(null);
      vi.spyOn(productionRepository, 'create').mockResolvedValue(25);
      vi.spyOn(productionRepository, 'findById').mockResolvedValue({
        ...sampleRecord,
        record_id: 25,
        production_date: '2026-10-19',
        target_quantity: 360,
        produced_quantity: 350,
      });

      const res = await request(app)
        .post('/api/production')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.record_id).toBe(25);
      expect(res.body.produced_quantity).toBe(350);
    });

    it('rejects negative produced_quantity with 400', async () => {
      const res = await request(app)
        .post('/api/production')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validPayload,
          produced_quantity: -10,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('returns 400 if target production line does not exist', async () => {
      vi.spyOn(productionRepository, 'lineExists').mockResolvedValue(false);

      const res = await request(app)
        .post('/api/production')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validPayload,
          line_id: 999,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Production line with ID 999 does not exist');
    });

    it('returns 409 Conflict if line/date/shift combination already exists', async () => {
      vi.spyOn(productionRepository, 'lineExists').mockResolvedValue(true);
      vi.spyOn(productionRepository, 'findByLineDateShift').mockResolvedValue(sampleRecord);

      const res = await request(app)
        .post('/api/production')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Conflict');
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('PUT /api/production/:id', () => {
    it('rejects unauthenticated update with 401', async () => {
      const res = await request(app).put('/api/production/1').send({ produced_quantity: 358 });
      expect(res.status).toBe(401);
    });

    it('rejects VIEWER role with 403 Forbidden', async () => {
      const res = await request(app)
        .put('/api/production/1')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ produced_quantity: 358 });
      expect(res.status).toBe(403);
    });

    it('updates record and returns 200', async () => {
      vi.spyOn(productionRepository, 'findById')
        .mockResolvedValueOnce(sampleRecord) // initial check
        .mockResolvedValueOnce({ ...sampleRecord, produced_quantity: 358 }); // after update
      vi.spyOn(productionRepository, 'findByLineDateShift').mockResolvedValue(null);
      vi.spyOn(productionRepository, 'update').mockResolvedValue(true);

      const res = await request(app)
        .put('/api/production/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ produced_quantity: 358 });

      expect(res.status).toBe(200);
      expect(res.body.produced_quantity).toBe(358);
    });

    it('returns 404 if record to update does not exist', async () => {
      vi.spyOn(productionRepository, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .put('/api/production/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ target_quantity: 400 });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });

    it('returns 400 if update payload is empty', async () => {
      const res = await request(app)
        .put('/api/production/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('DELETE /api/production/:id', () => {
    it('rejects unauthenticated delete with 401', async () => {
      const res = await request(app).delete('/api/production/1');
      expect(res.status).toBe(401);
    });

    it('rejects VIEWER role with 403 Forbidden', async () => {
      const res = await request(app)
        .delete('/api/production/1')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('deletes record successfully when no related quality issues exist', async () => {
      vi.spyOn(productionRepository, 'findById').mockResolvedValue(sampleRecord);
      vi.spyOn(productionRepository, 'countQualityIssuesByRecordId').mockResolvedValue(0);
      vi.spyOn(productionRepository, 'delete').mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/production/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deletedId).toBe(1);
    });

    it('returns 409 Conflict when record has associated quality issues', async () => {
      vi.spyOn(productionRepository, 'findById').mockResolvedValue(sampleRecord);
      vi.spyOn(productionRepository, 'countQualityIssuesByRecordId').mockResolvedValue(2);

      const res = await request(app)
        .delete('/api/production/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Conflict');
      expect(res.body.message).toContain('associated quality issue(s)');
    });

    it('returns 404 when record to delete does not exist', async () => {
      vi.spyOn(productionRepository, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/production/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });
  });
});
