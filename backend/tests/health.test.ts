import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import * as dbConfig from '../src/config/database';

describe('GET /api/health Endpoint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 200 with UP status when MySQL is reachable', async () => {
    vi.spyOn(dbConfig, 'testConnection').mockResolvedValue({
      connected: true,
      message: 'Database connection verified',
    });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('UP');
    expect(response.body.database).toBe('CONNECTED');
    expect(response.body.details).toBe('Database connection verified');
    expect(response.body.timestamp).toBeDefined();
  });

  it('returns 503 with DEGRADED status when MySQL is unreachable', async () => {
    vi.spyOn(dbConfig, 'testConnection').mockResolvedValue({
      connected: false,
      message: "connect ECONNREFUSED 127.0.0.1:3306",
    });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('DEGRADED');
    expect(response.body.database).toBe('DISCONNECTED');
    expect(response.body.error).toContain('ECONNREFUSED');
    expect(response.body.timestamp).toBeDefined();
  });
});
