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

// Define WebSocket readyState constants to avoid reference issues
const WS_CONNECTING = 0;
const WS_OPEN = 1;
const WS_CLOSING = 2;
const WS_CLOSED = 3;

export const useWebSocket = (): WebSocketHook => {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  // Start with CONNECTING state
  const [readyState, setReadyState] = useState<number>(WS_CONNECTING);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 10; // Increase max attempts for better resilience
  const connectionDelay = useRef<number>(0);

  // Create WebSocket connection
  useEffect(() => {
    let mounted = true; // Track component mount state
    
    // Create a function to establish connection
    const connectWebSocket = () => {
      // Safety check - don't try to connect if unmounted
      if (!mounted) return;
      
      try {
        // Determine the WebSocket URL using the current window location
        // Use pathname to handle subdirectory deployments
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        // Ensure the path is correct
        const wsUrl = `${protocol}//${host}/ws`;
        
        console.log(`[WebSocket] Connecting to ${wsUrl} (Attempt: ${reconnectAttemptsRef.current + 1})`);
        
        // Close any existing connection first as a safety measure
        if (socketRef.current) {
          try {
            // Only attempt to close if it's not already closed
            if (socketRef.current.readyState !== WS_CLOSED && 
                socketRef.current.readyState !== WS_CLOSING) {
              socketRef.current.close();
            }
          } catch (e) {
            console.warn('[WebSocket] Error closing existing connection:', e);
          }
          socketRef.current = null;
        }
        
        // Update UI state immediately
        setReadyState(WS_CONNECTING);
        
        // Create new WebSocket connection
        // We don't use the WebSocketClass reference to avoid potential issues 
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        // Connection established successfully
        socket.onopen = () => {
          if (!mounted) return;
          
          console.log('[WebSocket] Connection established');
          setReadyState(WS_OPEN);
          reconnectAttemptsRef.current = 0; // Reset reconnect attempts
          connectionDelay.current = 0; // Reset connection delay
          
          // Send initial ping to test connection is working properly
          try {
            socket.send(JSON.stringify({ 
              type: 'ping',
              timestamp: new Date().toISOString()
            }));
          } catch (e) {
            console.warn('[WebSocket] Error sending initial ping:', e);
          }
        };

        // Message received handler
        socket.onmessage = (event) => {
          if (!mounted) return;
          
          try {
            const data = JSON.parse(event.data);
            console.log('[WebSocket] Received:', data);
            setLastMessage(data);
          } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
          }
        };

        // Connection closed handler
        socket.onclose = (event) => {
          if (!mounted) return;
          
          console.log(`[WebSocket] Connection closed: Code=${event.code}, Reason=${event.reason || 'none'}`);
          setReadyState(WS_CLOSED);
          
          // Don't attempt to reconnect if it was a normal closure or component unmounted
          if (event.code === 1000 || !mounted) {
            return;
          }
          
          // Implement reconnection strategy
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            
            // Exponential backoff with jitter for distributed reconnection
            // Base delay between 1-3 seconds, max of 30 seconds
            const baseDelay = Math.min(1000 * (1 + reconnectAttemptsRef.current), 30000);
            const jitter = Math.random() * 1000; // Add up to 1 second of jitter
            const delay = baseDelay + jitter;
            connectionDelay.current = delay;
            
            console.log(`[WebSocket] Reconnecting in ${Math.round(delay/1000)}s (Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            
            // Clear any existing reconnect timeout
            if (reconnectTimeoutRef.current !== null) {
              window.clearTimeout(reconnectTimeoutRef.current);
            }
            
            // Schedule reconnection
            reconnectTimeoutRef.current = window.setTimeout(() => {
              if (mounted) {
                connectWebSocket();
              }
            }, delay);
          } else {
            console.warn(`[WebSocket] Max reconnection attempts (${maxReconnectAttempts}) reached`);
          }
        };

        // Error handler
        socket.onerror = (error) => {
          if (!mounted) return;
          
          console.error('[WebSocket] Error:', error);
          // Most errors are followed by onclose event, so we handle reconnection there
        };
      } catch (error) {
        if (!mounted) return;
        
        console.error('[WebSocket] Setup error:', error);
        setReadyState(WS_CLOSED);
        
        // Retry connecting on error
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(3000 * reconnectAttemptsRef.current, 30000);
          connectionDelay.current = delay;
          
          console.log(`[WebSocket] Retrying connection in ${Math.round(delay/1000)}s`);
          
          if (reconnectTimeoutRef.current !== null) {
            window.clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (mounted) {
              connectWebSocket();
            }
          }, delay);
        }
      }
    };

    // Start connection process
    connectWebSocket();

    // Clean up on component unmount
    return () => {
      mounted = false; // Mark component as unmounted
      console.log('[WebSocket] Cleaning up connection');
      
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close the socket if it exists
      if (socketRef.current) {
        try {
          // Only try to close if it's open
          if (socketRef.current.readyState === WS_OPEN || 
              socketRef.current.readyState === WS_CONNECTING) {
            socketRef.current.close(1000, "Component unmounted");
          }
        } catch (e) {
          console.warn('[WebSocket] Error during cleanup:', e);
        }
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Send message function with connection check
  const sendMessage = useCallback((message: WebSocketMessage) => {
    try {
      // Check if WebSocket is connected before sending
      if (socketRef.current && socketRef.current.readyState === WS_OPEN) {
        socketRef.current.send(JSON.stringify(message));
        return true;
      } else {
        console.warn('[WebSocket] Cannot send message - not connected', message);
        return false;
      }
    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
      return false;
    }
  }, []);

  return {
    sendMessage,
    lastMessage,
    readyState,
    connected: readyState === WS_OPEN
  };
};