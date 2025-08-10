import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
 type: string;
 data: Record<string, unknown>;
 timestamp: string;
}

export interface UsePubSubOptions {
 onJobExecution?: (data: Record<string, unknown>) => void;
 onJobStatus?: (data: Record<string, unknown>) => void;
 onSystemMetrics?: (data: Record<string, unknown>) => void;
 onNotification?: (data: Record<string, unknown>) => void;
 autoReconnect?: boolean;
 reconnectInterval?: number;
}

export interface PubSubState {
 connected: boolean;
 connecting: boolean;
 error: string | null;
 lastMessage: WebSocketMessage | null;
}

export function usePubSub(
 options: UsePubSubOptions = {},
 shouldConnect: boolean = true
): PubSubState & {
 connect: () => void;
 disconnect: () => void;
 reconnect: () => void;
} {
 const {
  onJobExecution,
  onJobStatus,
  onSystemMetrics,
  onNotification,
  autoReconnect = true,
  reconnectInterval = 5000,
 } = options;
 const [state, setState] = useState<PubSubState>({
  connected: false,
  connecting: false,
  error: null,
  lastMessage: null,
 });
 const socketRef = useRef<Socket | null>(null);
 const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
 const keepaliveRef = useRef<NodeJS.Timeout | null>(null);
 const handlersRef = useRef({
  onJobExecution,
  onJobStatus,
  onSystemMetrics,
  onNotification,
 });

 useEffect(() => {
  handlersRef.current = {
   onJobExecution,
   onJobStatus,
   onSystemMetrics,
   onNotification,
  };
 }, [onJobExecution, onJobStatus, onSystemMetrics, onNotification]);

 const getPubSubUrl = useCallback(() => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return baseUrl.replace('/api', '');
 }, []);

 const clearTimers = () => {
  if (reconnectTimeoutRef.current) {
   clearTimeout(reconnectTimeoutRef.current);
   reconnectTimeoutRef.current = null;
  }
  if (keepaliveRef.current) {
   clearInterval(keepaliveRef.current);
   keepaliveRef.current = null;
  }
 };

 const connect = useCallback(() => {
  if (socketRef.current?.connected) return;
  setState((prev) => ({ ...prev, connecting: true, error: null }));
  try {
   const wsUrl = getPubSubUrl();
   socketRef.current = io(wsUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: autoReconnect,
    reconnectionDelay: reconnectInterval,
    reconnectionAttempts: 5,
   });

   socketRef.current.on('connect', () => {
    setState((prev) => ({
     ...prev,
     connected: true,
     connecting: false,
     error: null,
    }));
    const token =
     typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) socketRef.current?.emit('authenticate', token);
    // Start keepalive ping every 20s
    if (keepaliveRef.current) clearInterval(keepaliveRef.current);
    keepaliveRef.current = setInterval(() => {
     try {
      socketRef.current?.emit('ping');
     } catch {}
    }, 20000);
   });

   socketRef.current.on('disconnect', () => {
    setState((prev) => ({ ...prev, connected: false, connecting: false }));
    clearTimers();
   });

   socketRef.current.on('connect_error', (error) => {
    setState((prev) => ({
     ...prev,
     connected: false,
     connecting: false,
     error: `Connection failed: ${error.message}`,
    }));
   });

   socketRef.current.on('authenticated', (data) => {});
   socketRef.current.on('authentication_error', (error) => {
    setState((prev) => ({
     ...prev,
     error: `Authentication failed: ${error.message}`,
    }));
   });

   socketRef.current.on('execution:ingested', (data) => {
    const message: WebSocketMessage = {
     type: 'execution:ingested',
     data,
     timestamp: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, lastMessage: message }));
    handlersRef.current.onJobExecution?.(data);
   });

   socketRef.current.on('notifications', (data) => {
    const message: WebSocketMessage = {
     type: 'notifications',
     data,
     timestamp: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, lastMessage: message }));
    handlersRef.current.onNotification?.(data);
   });

   socketRef.current.connect();
  } catch (error) {
   setState((prev) => ({
    ...prev,
    connected: false,
    connecting: false,
    error: 'Failed to create WebSocket connection',
   }));
   clearTimers();
  }
 }, [getPubSubUrl, autoReconnect, reconnectInterval]);

 const disconnect = useCallback(() => {
  clearTimers();
  if (socketRef.current) {
   socketRef.current.disconnect();
   socketRef.current = null;
  }
  setState({
   connected: false,
   connecting: false,
   error: null,
   lastMessage: null,
  });
 }, []);

 const reconnect = useCallback(() => {
  disconnect();
  setTimeout(() => connect(), 1000);
 }, [connect, disconnect]);

 useEffect(() => {
  if (typeof window !== 'undefined' && shouldConnect) connect();
  return () => disconnect();
 }, [connect, disconnect, shouldConnect]);

 return { ...state, connect, disconnect, reconnect };
}
