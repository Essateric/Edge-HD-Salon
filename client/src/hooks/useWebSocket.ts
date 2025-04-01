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
  const WebSocketClass = WebSocket; // Store WebSocket class reference for consistent usage

  // Create WebSocket connection
  useEffect(() => {
    // Create a function to establish connection
    const connectWebSocket = () => {
      try {
        // Determine the WebSocket URL - use relative URL to avoid domain issues
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        // Use a relative path to avoid any domain/token issues
        const wsUrl = `${protocol}//${host}/ws`;
        
        console.log('Attempting WebSocket connection to:', wsUrl);
        
        // Close any existing connection
        if (socketRef.current && socketRef.current.readyState !== WebSocketClass.CLOSED) {
          socketRef.current.close();
        }
        
        // Create new WebSocket connection
        const socket = new WebSocketClass(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          console.log('WebSocket connection established');
          setReadyState(WebSocketClass.OPEN);
          reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
          
          // Send initial ping to test connection
          try {
            socket.send(JSON.stringify({ type: 'ping' }));
          } catch (e) {
            console.error('Error sending initial ping message:', e);
          }
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
          setReadyState(WebSocketClass.CLOSED);
          
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
          // We'll set the readyState as an additional safety measure
          setReadyState(socket.readyState);
          // Most errors will be followed by onclose, so we'll handle reconnection there
        };
      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
        setReadyState(WebSocketClass.CLOSED);
        
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
        try {
          if (socketRef.current.readyState === WebSocketClass.OPEN) {
            socketRef.current.close();
          }
        } catch (e) {
          console.error('Error closing WebSocket connection:', e);
        }
        socketRef.current = null;
      }
    };
  }, []);

  // Send message function
  const sendMessage = useCallback((message: WebSocketMessage) => {
    try {
      if (socketRef.current && socketRef.current.readyState === WebSocketClass.OPEN) {
        socketRef.current.send(JSON.stringify(message));
      } else {
        console.warn('WebSocket not connected, message not sent:', message);
      }
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }, []);

  return {
    sendMessage,
    lastMessage,
    readyState,
    connected: readyState === WebSocketClass.OPEN
  };
};