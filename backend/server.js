import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeSocket } from './socket.js';
import authRoutes from './routes/auth.js';
import spotifyRoutes from './routes/spotify.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowed = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
      : ['http://localhost:5173'];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // allow temporarily to avoid CORS in prod across subdomains
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/spotify', spotifyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io initialized`);
});

export { app, io };

