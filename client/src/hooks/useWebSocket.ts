import { useState, useEffect, useCallback, useRef } from 'react';

// WebSocket message type
type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

// Hook return type
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
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;

  // Create WebSocket connection
  useEffect(() => {
    // Create a function to establish connection
    const connectWebSocket = () => {
      try {
        // Determine the WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        // Use a fully qualified path to ensure we connect correctly
        const wsUrl = `${protocol}//${host}/ws`;
        
        console.log('Attempting WebSocket connection to:', wsUrl);
        
        // Close any existing connection
        if (socketRef.current) {
          socketRef.current.close();
        }
        
        // Create new WebSocket connection
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          console.log('WebSocket connection established');
          setReadyState(WebSocket.OPEN);
          reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
          
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
          
          // Attempt to reconnect after a delay, unless it was a clean close or max attempts reached
          if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            const delay = Math.min(3000 * reconnectAttemptsRef.current, 10000); // Exponential backoff
            
            console.log(`Scheduling reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`);
            
            // Clear any existing reconnect timeout
            if (reconnectTimeoutRef.current !== null) {
              window.clearTimeout(reconnectTimeoutRef.current);
            }
            
            // Schedule a reconnection attempt
            reconnectTimeoutRef.current = window.setTimeout(() => {
              console.log('Attempting to reconnect WebSocket...');
              connectWebSocket();
            }, delay);
          } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.log('Maximum reconnection attempts reached, giving up');
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          // Errors will be followed by onclose, so we'll handle reconnection there
        };
      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
        // Schedule a retry if connection setup fails
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(3000 * reconnectAttemptsRef.current, 10000);
          
          console.log(`Error creating socket, retrying in ${delay}ms`);
          
          if (reconnectTimeoutRef.current !== null) {
            window.clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, delay);
        }
      }
    };

    // Start the connection process
    connectWebSocket();

    // Clean up on unmount
    return () => {
      console.log('Cleaning up WebSocket connection');
      
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current !== null) {
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