import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
 type: string;
 data: Record<string, unknown>;
 timestamp: string;
}

export interface UseWebSocketOptions {
 onJobExecution?: (data: Record<string, unknown>) => void;
 onJobStatus?: (data: Record<string, unknown>) => void;
 onSystemMetrics?: (data: Record<string, unknown>) => void;
 onNotification?: (data: Record<string, unknown>) => void;
 autoReconnect?: boolean;
 reconnectInterval?: number;
}

export interface WebSocketState {
 connected: boolean;
 connecting: boolean;
 error: string | null;
 lastMessage: WebSocketMessage | null;
}

export function useWebSocket(
 options: UseWebSocketOptions = {}
): WebSocketState & {
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

 const [state, setState] = useState<WebSocketState>({
  connected: false,
  connecting: false,
  error: null,
  lastMessage: null,
 });

 const socketRef = useRef<Socket | null>(null);
 const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
 const handlersRef = useRef({
  onJobExecution,
  onJobStatus,
  onSystemMetrics,
  onNotification,
 });

 // Update handlers when options change
 useEffect(() => {
  handlersRef.current = {
   onJobExecution,
   onJobStatus,
   onSystemMetrics,
   onNotification,
  };
 }, [onJobExecution, onJobStatus, onSystemMetrics, onNotification]);

 const getWebSocketUrl = useCallback(() => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // Socket.IO doesn't need the /api path, just the base URL
  // Remove /api from the URL if it exists
  return baseUrl.replace('/api', '');
 }, []);

 const connect = useCallback(() => {
  if (socketRef.current?.connected) {
   return; // Already connected
  }

  setState((prev) => ({ ...prev, connecting: true, error: null }));

  try {
   const wsUrl = getWebSocketUrl();
   console.log('Connecting to WebSocket URL:', wsUrl);

   socketRef.current = io(wsUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: autoReconnect,
    reconnectionDelay: reconnectInterval,
    reconnectionAttempts: 5,
   });

   // Connection events
   socketRef.current.on('connect', () => {
    setState((prev) => ({
     ...prev,
     connected: true,
     connecting: false,
     error: null,
    }));
    console.log('WebSocket connected');

    // Authenticate with token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
     socketRef.current?.emit('authenticate', token);
    }
   });

   socketRef.current.on('disconnect', () => {
    setState((prev) => ({
     ...prev,
     connected: false,
     connecting: false,
    }));
    console.log('WebSocket disconnected');
   });

   socketRef.current.on('connect_error', (error) => {
    setState((prev) => ({
     ...prev,
     connected: false,
     connecting: false,
     error: `Connection failed: ${error.message}`,
    }));
    console.error('WebSocket connection error:', error);
   });

   // Authentication events
   socketRef.current.on('authenticated', (data) => {
    console.log('WebSocket authenticated:', data);
   });

   socketRef.current.on('authentication_error', (error) => {
    console.error('WebSocket authentication error:', error);
    setState((prev) => ({
     ...prev,
     error: `Authentication failed: ${error.message}`,
    }));
   });

   // Message events
   socketRef.current.on('job_execution', (data) => {
    const message: WebSocketMessage = {
     type: 'job_execution',
     data,
     timestamp: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, lastMessage: message }));
    handlersRef.current.onJobExecution?.(data);
   });

   socketRef.current.on('job_status', (data) => {
    const message: WebSocketMessage = {
     type: 'job_status',
     data,
     timestamp: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, lastMessage: message }));
    handlersRef.current.onJobStatus?.(data);
   });

   socketRef.current.on('system_metrics', (data) => {
    const message: WebSocketMessage = {
     type: 'system_metrics',
     data,
     timestamp: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, lastMessage: message }));
    handlersRef.current.onSystemMetrics?.(data);
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

   // Connect the socket
   socketRef.current.connect();
  } catch (error) {
   setState((prev) => ({
    ...prev,
    connected: false,
    connecting: false,
    error: 'Failed to create WebSocket connection',
   }));
   console.error('Failed to create WebSocket:', error);
  }
 }, [getWebSocketUrl, autoReconnect, reconnectInterval]);

 const disconnect = useCallback(() => {
  if (reconnectTimeoutRef.current) {
   clearTimeout(reconnectTimeoutRef.current);
   reconnectTimeoutRef.current = null;
  }

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
  setTimeout(() => {
   connect();
  }, 1000);
 }, [connect, disconnect]);

 // Auto-connect on mount
 useEffect(() => {
  if (typeof window !== 'undefined') {
   // Connect even without token for now to test connection
   connect();
  }

  return () => {
   disconnect();
  };
 }, [connect, disconnect]);

 return {
  ...state,
  connect,
  disconnect,
  reconnect,
 };
}
