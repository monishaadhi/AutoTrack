import path from 'path';
import dotenv from 'dotenv';

// Ensure backend/.env is loaded
const envPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { testConnection } from './config/database';

import authRouter from './routes/auth.routes';
import productionRouter from './routes/production.routes';
import lineRouter from './routes/line.routes';
import dashboardRouter from './routes/dashboard.routes';
import qualityRouter from './routes/quality.routes';

const app: Application = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check endpoint with real MySQL connectivity verification
app.get(['/api/health', '/health'], async (req: Request, res: Response) => {
  const dbHealth = await testConnection();

  if (dbHealth.connected) {
    return res.status(200).json({
      status: 'UP',
      database: 'CONNECTED',
      timestamp: new Date().toISOString(),
      details: dbHealth.message,
    });
  }

  return res.status(503).json({
    status: 'DEGRADED',
    database: 'DISCONNECTED',
    timestamp: new Date().toISOString(),
    error: dbHealth.message,
  });
});

// Authentication API Routes
app.use('/api/auth', authRouter);

// Production Monitoring API Routes
app.use('/api/production', productionRouter);
app.use('/api/lines', lineRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/quality-issues', qualityRouter);

// Centralized error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected server error occurred.' });
});

export default app;
