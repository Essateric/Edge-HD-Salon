import { useState, useEffect, useCallback, useRef } from 'react';

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

type WebSocketHook = {
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  readyState: number;
  connected: boolean;
};

export const useWebSocket = (): WebSocketHook => {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Create WebSocket connection
  useEffect(() => {
    // Only use absolute paths for WebSocket connections
    let wsUrl = '';
    // Get base URL without any path components
    const baseUrl = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${protocol}//${baseUrl}/ws`;
    
    console.log('Connecting to WebSocket at:', wsUrl);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection established');
      setReadyState(WebSocket.OPEN);
      
      // Send initial ping to test connection
      socket.send(JSON.stringify({ type: 'ping' }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        setLastMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket connection closed', event.code, event.reason);
      setReadyState(WebSocket.CLOSED);
      
      // Attempt to reconnect after a delay, unless it was a clean close
      if (event.code !== 1000) {
        console.log('Scheduling reconnection attempt...');
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current);
        }
        
        // Schedule a reconnection attempt
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          // We'll let the effect cleanup and re-run handle the reconnection
          if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
            setReadyState(WebSocket.CONNECTING);
          }
        }, 3000); // Try to reconnect after 3 seconds
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Errors will be followed by onclose, so we'll handle reconnection there
    };

    // Clean up on unmount
    return () => {
      console.log('Cleaning up WebSocket connection');
      
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close the socket if it exists
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  // Send message function
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }, []);

  return {
    sendMessage,
    lastMessage,
    readyState,
    connected: readyState === WebSocket.OPEN
  };
};