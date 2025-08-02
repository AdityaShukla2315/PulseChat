import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// Configuration for Socket.IO server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5177"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  path: "/socket.io/",
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 30000, // Increase timeout to 30 seconds
  pingInterval: 10000, // Send ping every 10 seconds
  cookie: false,
  serveClient: false
});

// Store user socket mappings
const userSocketMap = {}; // {userId: socketId}

/**
 * Get the socket ID for a user
 * @param {string} userId - The user ID to look up
 * @returns {string|null} The socket ID or null if not found
 */
export function getReceiverSocketId(userId) {
  if (!userId) {
    console.warn('getReceiverSocketId called with undefined or null userId');
    return null;
  }
  return userSocketMap[userId.toString()];
}

// Track connection status
let connectionCount = 0;

io.on("connection", (socket) => {
  const connectionId = ++connectionCount;
  const userId = socket.handshake.query.userId;
  const clientIp = socket.handshake.address;
  
  console.log(`\n=== New Connection [${connectionId}] ===`);
  console.log(`Socket ID: ${socket.id}`);
  console.log(`User ID: ${userId}`);
  console.log(`Client IP: ${clientIp}`);
  console.log(`Headers:`, socket.handshake.headers);
  
  // Add to user socket map if userId is provided
  if (userId) {
    const prevSocketId = userSocketMap[userId];
    if (prevSocketId && prevSocketId !== socket.id) {
      console.log(`User ${userId} reconnected, removing previous socket ${prevSocketId}`);
      io.sockets.sockets.get(prevSocketId)?.disconnect(true);
    }
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} mapped to socket ${socket.id}`);
  }

  // Throttle online users update to prevent excessive emissions
  const updateOnlineUsers = () => {
    const onlineUsers = Object.keys(userSocketMap);
    console.log('Online users:', onlineUsers);
    io.emit("getOnlineUsers", onlineUsers);
  };

  // Use a module-scoped variable for debouncing
  if (typeof global.updateOnlineUsersTimeout !== 'undefined') {
    clearTimeout(global.updateOnlineUsersTimeout);
  }
  global.updateOnlineUsersTimeout = setTimeout(updateOnlineUsers, 100); // 100ms debounce

  // Handle typing indicators
  socket.on("typing", (data) => {
    console.log(`User ${userId} typing to ${data?.receiverId}`);
    if (!data?.receiverId) return;
    
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { 
        senderId: userId,
        timestamp: Date.now() 
      });
    }
  });

  socket.on("stopTyping", (data) => {
    if (!data?.receiverId) return;
    
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { 
        senderId: userId,
        timestamp: Date.now() 
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log(`\n=== Disconnection [${connectionId}] ===`);
    console.log(`Socket ID: ${socket.id}`);
    console.log(`User ID: ${userId}`);
    console.log(`Reason: ${reason}`);
    
    // Only clean up if this socket is still mapped to the user
    if (userId && userSocketMap[userId] === socket.id) {
      console.log(`Removing user ${userId} from online users`);
      delete userSocketMap[userId];
      
      // Use the same debounced update function
      if (typeof global.updateOnlineUsersTimeout !== 'undefined') {
        clearTimeout(global.updateOnlineUsersTimeout);
      }
      global.updateOnlineUsersTimeout = setTimeout(updateOnlineUsers, 100);
    }
    
    console.log(`Remaining online users:`, Object.keys(userSocketMap));
  });

  // Error handling
  socket.on("error", (error) => {
    console.error(`Socket error [${connectionId}]:`, error);
  });

  // Debug event
  socket.on("ping", (data) => {
    console.log(`Ping from ${socket.id}:`, data);
    socket.emit("pong", { timestamp: Date.now(), ...data });
  });

  // Log connection established
  socket.emit("connection_established", { 
    socketId: socket.id, 
    userId,
    timestamp: Date.now()
  });
  
  console.log(`Connection [${connectionId}] setup complete\n`);
});

// Log server start

export { io, app, server };
