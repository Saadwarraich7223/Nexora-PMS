import { io } from "socket.io-client";

let socket = null;

// Determine backend URL from env or fallback to local
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const connectSocket = (userId) => {
  if (!userId) return;

  // Only connect if we don't have an active socket
  if (!socket) {
    socket = io(`${SOCKET_URL}/notifications`, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      // Send user ID to join private notification room
      socket.emit("join", userId);
    });

    socket.on("disconnect", () => {
      // Will auto-reconnect
    });
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const onNotification = (callback) => {
  if (!socket) return () => {};

  socket.on("notification:new", callback);

  // Return unsubscribe function
  return () => {
    socket.off("notification:new", callback);
  };
};
