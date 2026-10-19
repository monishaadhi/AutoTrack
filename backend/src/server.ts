import path from 'path';
import dotenv from 'dotenv';

// Ensure backend/.env is loaded before reading process.env
const envPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}
dotenv.config();

import app from './app';

const PORT = Number(process.env.PORT) || 5001;

const server = app.listen(PORT, () => {
  console.log(`AutoTrack Backend server running on port ${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `[AutoTrack Server Error] Port ${PORT} is already in use.\n` +
      `Note: On macOS, AirPlay Receiver / ControlCenter may occupy port 5000 by default.\n` +
      `You can specify an alternate port like PORT=5001 in your .env file or disable AirPlay Receiver in System Settings.`
    );
  } else {
    console.error('[AutoTrack Server Error]:', err);
  }
});
