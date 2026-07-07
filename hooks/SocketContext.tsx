import React, { useEffect, useRef, useState, createContext, useContext } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { getApiBase } from "@/utils/api";

// 1. Create the Context
const SocketContext = createContext<Socket | null>(null);

// 2. Create the Provider
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { authUser } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!authUser?.id) {
      if (socketRef.current) {
        console.log("🔌 Auth lost, disconnecting socket");
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    if (socketRef.current) return;

    console.log("🟢 Initializing shared socket for:", authUser.id);

    const newSocket = io(getApiBase(), {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 800,
      query: { 
        userId: authUser.id, 
        userName: authUser.name || "Guest" 
      },
    });

    newSocket.on("connect", () => {
      console.log("🟢 Socket connected:", newSocket.id);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up shared socket");
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [authUser?.id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};