import { Server } from 'socket.io';

/**
 * Initialize Socket.io server
 * @param {Server} httpServer - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Store active rooms
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    /**
     * Join a room
     */
    socket.on('join_room', ({ roomId, username }) => {
      socket.join(roomId);

      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          users: [],
          queue: [],
          currentTrack: null,
          votes: new Map(),
        });
      }

      const room = rooms.get(roomId);
      const user = { id: socket.id, username: username || `User ${socket.id.slice(0, 6)}` };
      
      // Add user if not already in room
      if (!room.users.find(u => u.id === socket.id)) {
        room.users.push(user);
      }

      // Notify room of new user
      io.to(roomId).emit('user_joined', {
        user,
        users: room.users,
      });

      // Send current room state to new user
      socket.emit('room_state', {
        users: room.users,
        queue: room.queue,
        currentTrack: room.currentTrack,
      });

      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    /**
     * Leave a room
     */
    socket.on('leave_room', ({ roomId }) => {
      socket.leave(roomId);

      const room = rooms.get(roomId);
      if (room) {
        room.users = room.users.filter(u => u.id !== socket.id);
        
        // Clean up votes from this user
        room.votes.delete(socket.id);

        // If room is empty, delete it after a delay
        if (room.users.length === 0) {
          setTimeout(() => {
            if (rooms.get(roomId)?.users.length === 0) {
              rooms.delete(roomId);
            }
          }, 60000); // 1 minute delay
        } else {
          io.to(roomId).emit('user_left', {
            userId: socket.id,
            users: room.users,
          });
        }
      }

      console.log(`User ${socket.id} left room ${roomId}`);
    });

    /**
     * Queue a track
     */
    socket.on('queue_track', ({ roomId, track }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.queue.push({
          ...track,
          addedBy: socket.id,
          timestamp: Date.now(),
        });

        io.to(roomId).emit('track_queued', {
          track: room.queue[room.queue.length - 1],
          queue: room.queue,
        });

        // If no current track, play the first queued track
        if (!room.currentTrack && room.queue.length > 0) {
          room.currentTrack = room.queue.shift();
          io.to(roomId).emit('track_changed', {
            track: room.currentTrack,
            queue: room.queue,
          });
        }
      }
    });

    /**
     * Vote to skip current track
     */
    socket.on('vote_skip', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && room.currentTrack) {
        room.votes.set(socket.id, true);

        const voteCount = room.votes.size;
        const userCount = room.users.length;
        const threshold = Math.ceil(userCount / 2); // 50% majority

        io.to(roomId).emit('vote_update', {
          votes: voteCount,
          threshold,
        });

        if (voteCount >= threshold) {
          // Skip track
          room.currentTrack = null;
          room.votes.clear();

          // Play next track if available
          if (room.queue.length > 0) {
            room.currentTrack = room.queue.shift();
          }

          io.to(roomId).emit('track_skipped', {
            currentTrack: room.currentTrack,
            queue: room.queue,
          });
        }
      }
    });

    /**
     * Update playback state
     */
    socket.on('playback_update', ({ roomId, isPlaying, position }) => {
      socket.to(roomId).emit('playback_sync', {
        isPlaying,
        position,
      });
    });

    /**
     * React to current track
     */
    socket.on('track_reaction', ({ roomId, reaction }) => {
      io.to(roomId).emit('reaction_added', {
        userId: socket.id,
        reaction,
      });
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      // Remove user from all rooms
      for (const [roomId, room] of rooms.entries()) {
        const userIndex = room.users.findIndex(u => u.id === socket.id);
        if (userIndex !== -1) {
          room.users.splice(userIndex, 1);
          room.votes.delete(socket.id);

          if (room.users.length === 0) {
            setTimeout(() => {
              if (rooms.get(roomId)?.users.length === 0) {
                rooms.delete(roomId);
              }
            }, 60000);
          } else {
            io.to(roomId).emit('user_left', {
              userId: socket.id,
              users: room.users,
            });
          }
        }
      }
    });
  });

  return io;
}