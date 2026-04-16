import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import express from 'express';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { registerChatHandlers } from './socket/chatHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import adminApiRoutes from './routes/adminApiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// `.env` is expected to be inside this folder (`backend/.env`).
dotenv.config({ path: path.join(__dirname, '.env') });
const PORT = process.env.PORT || 4000;

await connectDB();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/matches', matchRoutes);
app.use('/request', requestRoutes);
app.use('/chat', chatRoutes);
app.use('/assistant', assistantRoutes);
app.use('/rooms', roomRoutes);
app.use('/report', reportRoutes);
app.use('/notification', notificationRoutes);
app.use('/api', adminApiRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Server error.' });
});

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: true },
  path: '/socket.io',
});
registerChatHandlers(io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
