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

  // Create WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
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

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setReadyState(WebSocket.CLOSED);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Clean up on unmount
    return () => {
      console.log('Closing WebSocket connection');
      socket.close();
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