import { Server } from "socket.io";
import config from "../config/env.js";

let _io = null;

/**
 * Returns the shared Socket.IO instance.
 * Call only after setupSockets() has been invoked.
 */
export const getIO = () => _io;

const setupSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: config.corsOrigin || "*",
      methods: ["GET", "POST"],
    },
  });

  _io = io;

  // ── Notifications namespace ──────────────────────────────────────────────
  // Each authenticated user joins a private room identified by their userId.
  // The notification service emits `notification:new` into that room whenever
  // a notification is created for that user.
  const notifNamespace = io.of("/notifications");

  notifNamespace.on("connection", (socket) => {
    // Client sends their userId after connecting so we can route events to them
    socket.on("join", (userId) => {
      if (userId) {
        socket.join(String(userId));
      }
    });

    socket.on("disconnect", () => {
      // Cleanup handled automatically by socket.io room management
    });
  });

  // ── Canvas namespace (existing) ──────────────────────────────────────────
  // Namespace for live collaborative architecture canvas per group room.
  const canvasNamespace = io.of("/canvas");

  canvasNamespace.on("connection", (socket) => {
    // When a user connects to the canvas, they send their groupId to join a room
    socket.on("join-room", (groupId) => {
      socket.join(groupId);
    });

    // Handle generic tldraw state updates broadcast to the room
    socket.on("canvas-update", ({ groupId, updates }) => {
      // Broadcast this update to everyone else in the group room
      socket.to(groupId).emit("canvas-update", updates);
    });

    // Handle cursor/pointer moves
    socket.on("cursor-move", ({ groupId, cursor }) => {
      socket.to(groupId).emit("cursor-move", cursor);
    });

    socket.on("disconnect", () => {
      // Cleanup if needed
    });
  });

  return io;
};

export default setupSockets;
