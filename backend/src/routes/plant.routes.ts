import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2/promise';

const router = Router();

// GET /api/plants - List all automotive manufacturing facilities
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT plant_id, plant_code, plant_name, location, country, timezone, created_at FROM plants ORDER BY plant_id ASC'
    );
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('[PlantRoute Error]:', err);
    res.status(500).json({ error: 'Failed to fetch plant list' });
  }
});

export default router;
