import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { getWebSocketUrl } from '../lib/api';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [lastMessage, setLastMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);

    useEffect(() => {
        let reconnectTimeout;
        const connect = () => {
            const wsUrl = getWebSocketUrl('/ws/soc');
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('Connected to PhishGuard SOC WebSocket');
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);
                } catch (e) {
                    console.error("Failed to parse WebSocket message", e);
                }
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected, reconnecting in 3s...');
                setIsConnected(false);
                reconnectTimeout = setTimeout(connect, 3000);
            };

            ws.onerror = (err) => {
                console.error('WebSocket Error', err);
                ws.close();
            };

            wsRef.current = ws;
        };

        connect();

        return () => {
            clearTimeout(reconnectTimeout);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ isConnected, lastMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
