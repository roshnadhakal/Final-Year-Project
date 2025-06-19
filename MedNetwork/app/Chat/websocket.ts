import { Alert } from 'react-native';
import config from '@config';
import { useAuth } from '@context/AuthContext';

let socket: WebSocket | null = null;
let messageListeners: ((message: any) => void)[] = [];
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

export const initWebSocket = async (token: string, userId: string) => {
    if (socket) return;
    
    const wsUrl = config.WS_URL || config.BASE_URL.replace('http', 'ws');
    socket = new WebSocket(`${wsUrl}/ws/chat/?token=${token}&user_id=${userId}`);
    
    socket.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts = 0;
    };
    
    socket.onmessage = (e) => {
        try {
            const message = JSON.parse(e.data);
            messageListeners.forEach(listener => listener(message));
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };
    
    socket.onclose = (e) => {
        console.log('WebSocket disconnected', e.code, e.reason);
        socket = null;
        
        if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Reconnecting in ${delay}ms...`);
            reconnectAttempts++;
            setTimeout(() => initWebSocket(token, userId), delay);
        }
    };
    
    socket.onerror = (e) => {
        console.error('WebSocket error:', e);
    };
};

export const closeWebSocket = () => {
    if (socket) {
        socket.close();
        socket = null;
    }
    messageListeners = [];
    reconnectAttempts = 0;
};

export const addMessageListener = (listener: (message: any) => void) => {
    messageListeners.push(listener);
    return () => {
        messageListeners = messageListeners.filter(l => l !== listener);
    };
};

export const sendWebSocketMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
        return true;
    }
    return false;
};

export const getWebSocketState = () => {
    if (!socket) return WebSocket.CLOSED;
    return socket.readyState;
};