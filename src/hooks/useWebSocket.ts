import { useState, useEffect, useCallback } from 'react';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface UseWebSocketReturn {
  sendMessage: (message: string) => void;
  lastMessage: string | null;
  connectionStatus: ConnectionStatus;
}

export const useWebSocket = (path: string): UseWebSocketReturn => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  // Initialize WebSocket connection
  useEffect(() => {
    const wsUrl = `wss://oracle-api-server-production.up.railway.app${path}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      setLastMessage(event.data);
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      // Attempt to reconnect after 2 seconds
      setTimeout(() => {
        setConnectionStatus('connecting');
        setSocket(new WebSocket(wsUrl));
      }, 2000);
    };

    ws.onerror = () => {
      setConnectionStatus('disconnected');
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, [path]);

  // Send message function
  const sendMessage = useCallback((message: string) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }, [socket]);

  return {
    sendMessage,
    lastMessage,
    connectionStatus
  };
}; 