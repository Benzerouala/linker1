// frontend/src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import API_URL from "../utils/api";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [tokenVersion, setTokenVersion] = useState(0);

  // Réagir au login/logout (token changé) pour (re)connecter la socket
  useEffect(() => {
    const onAuthChange = () => setTokenVersion((v) => v + 1);
    window.addEventListener("auth-change", onAuthChange);
    return () => window.removeEventListener("auth-change", onAuthChange);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setSocket((prev) => {
        if (prev) prev.disconnect();
        return null;
      });
      setConnected(false);
      return;
    }

    console.log("🔌 Connecting to socket server...");

    const newSocket = io(API_URL.replace("/api", ""), {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [API_URL, tokenVersion]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
