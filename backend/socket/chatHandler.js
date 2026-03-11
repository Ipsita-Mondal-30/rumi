import jwt from 'jsonwebtoken';
import { Message } from '../models/Message.js';
import { Request } from '../models/Request.js';

const JWT_SECRET = process.env.JWT_SECRET || 'rumi-jwt-secret-change-in-production';

/**
 * Verify JWT from handshake auth or query.
 */
function getUserId(socket) {
  const token = socket.handshake?.auth?.token || socket.handshake?.query?.token;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

/**
 * Register chat handlers on the given io instance.
 */
export function registerChatHandlers(io) {
  io.on('connection', async (socket) => {
    const userId = getUserId(socket);
    if (!userId) {
      socket.emit('error', { message: 'Authentication required.' });
      socket.disconnect(true);
      return;
    }

    const room = `user:${userId}`;
    socket.join(room);

    socket.on('message', async (payload) => {
      const { receiverId, message } = payload || {};
      if (!receiverId || !message?.trim()) {
        socket.emit('error', { message: 'receiverId and message required.' });
        return;
      }
      if (userId.toString() === receiverId.toString()) {
        socket.emit('error', { message: 'Cannot send message to yourself.' });
        return;
      }

      const accepted = await Request.findOne({
        $or: [
          { fromUserId: userId, toUserId: receiverId },
          { fromUserId: receiverId, toUserId: userId },
        ],
        status: 'accepted',
      });
      if (!accepted) {
        socket.emit('error', { message: 'Not connected. Accept the request first.' });
        return;
      }

      const doc = await Message.create({
        senderId: userId,
        receiverId: receiverId,
        message: message.trim(),
      });

      const receiverRoom = `user:${receiverId}`;
      io.to(receiverRoom).emit('message', {
        _id: doc._id,
        senderId: doc.senderId,
        receiverId: doc.receiverId,
        message: doc.message,
        timestamp: doc.timestamp,
      });
      socket.emit('message_sent', { _id: doc._id });
    });

    socket.on('disconnect', () => {});
  });
}
