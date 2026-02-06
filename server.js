import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import { connectDB, seedDB } from './db.js';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';

const app = express();
const PORT = process.env.PORT || 4000;

// ✅ CORS configuration - allows requests from frontend
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://192.168.1.57:3000',
  'https://www.24carrental.in',
  'https://24carrental.in',
  'http://www.24carrental.in',
  'http://24carrental.in',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development or if FRONTEND_URL is not set
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send({ status: '24 Car Rental backend', version: '0.1.0' });
});

async function start() {
  try {
    await connectDB();
    await seedDB();

    // Create HTTP server and attach socket.io
    const httpServer = createServer(app);
    const io = new IOServer(httpServer, {
      cors: { origin: '*' }
    });

    // Attach io to app so route handlers can emit events
    app.locals.io = io;

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      socket.on('joinDashboard', () => {
        socket.join('dashboard');
        console.log('Socket joined dashboard:', socket.id);
      });

      socket.on('leaveDashboard', () => {
        socket.leave('dashboard');
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', socket.id, reason);
      });
    });

    // ✅ Important: listen on all interfaces
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ 24 Car Rental backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
