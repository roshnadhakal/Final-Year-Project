import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from '@context/AuthContext';
import {  Alert } from 'react-native';
import config from '@config';

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
};
export type ChatParticipant = {
  id: string;
  name: string;
  profile_pic: string | null;
  user_type: 'patient' | 'doctor' | string; 
};

export type Chat = {
  id: string;
  patient: {
    id: string;
    name: string;
    profile_pic: string | null;
    user_type: 'patient';
  };
  doctor: {
    id: string;
    name: string;
    profile_picture: string | null;
    user_type: 'doctor';
  };
  last_message?: Message;
  unread_count: number;
  participant?: ChatParticipant;
};
type WebSocketContextType = {
  socket: WebSocket | null;
  isConnected: boolean;
  messages: Message[];
  chats: Chat[];
  currentChat: Chat | null;
  sendMessage: (content: string, receiverId: string) => void;
  setCurrentChat: (chat: Chat | null) => void;
  markMessagesAsRead: (chatId: string) => void;
  fetchInitialChats: () => Promise<void>;
};

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  messages: [],
  chats: [],
  currentChat: null,
  sendMessage: () => {},
  setCurrentChat: () => {},
  markMessagesAsRead: () => {},
  fetchInitialChats: async () => {},
});

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const fetchInitialChats = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/chats/`, {
        headers: {
          'Content-Type': 'application/json',
          ...(user?.access_token && { 'Authorization': `Bearer ${user.access_token}` }),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch chats');
      
      const data = await response.json();
      setChats(data); // Update the chats state
    } catch (error) {
      console.error('Error fetching initial chats:', error);
      throw error;
    }
  };

  const initializeChat = async (patientId: string, doctorId: string, userType: 'patient' | 'doctor') => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
  
      // Check if chat exists in local state
      const existingChat = chats.find(chat => 
        chat.patient.id === patientId && chat.doctor.id === doctorId
      );
      
      if (existingChat) {
        setCurrentChat(existingChat);
        return;
      }
      
      // Fetch from server if not found locally
      const response = await fetch(`${config.BASE_URL}/api/chats/get_or_create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user.access_token && { 'Authorization': `Bearer ${user.access_token}` }),
        },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: doctorId
        })
      });
      
      if (!response.ok) throw new Error('Failed to initialize chat');
      
      const chatData = await response.json();
      
      // Create properly typed chat object
      const newChat: Chat = {
        id: chatData.id,
        patient: {
          id: chatData.patient.id,
          name: chatData.patient.full_name || chatData.patient.name || 'Patient',
          profile_pic: chatData.patient.profile_pic || null,
          user_type: 'patient'
        },
        doctor: {
          id: chatData.doctor.id,
          name: chatData.doctor.full_name || chatData.doctor.name || 'Doctor',
          profile_picture: chatData.doctor.profile_picture || null,
          user_type: 'doctor'
        },
        last_message: chatData.last_message,
        unread_count: chatData.unread_count || 0,
        participant: userType === 'patient' ? 
          {
            id: chatData.doctor.id,
            name: chatData.doctor.full_name || chatData.doctor.name || 'Doctor',
            profile_pic: chatData.doctor.profile_picture || null,
            user_type: 'doctor'
          } : {
            id: chatData.patient.id,
            name: chatData.patient.full_name || chatData.patient.name || 'Patient',
            profile_pic: chatData.patient.profile_pic || null,
            user_type: 'patient'
          }
      };
      
      setCurrentChat(newChat);
      setChats(prev => [...prev, newChat]);
      
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const connectWebSocket = () => {
      if (!user?.id || !user?.user_type) return;
      const wsUrl = config.WS_URL || `ws://${config.BASE_URL.replace(/^https?:\/\//, '')}/ws/chat/`;
      const newSocket = new WebSocket(`${wsUrl}?user_id=${user.id}&user_type=${user.user_type}`);

      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        // Fetch initial chats when connection is established
        fetchInitialChats().catch(console.error);
      };

      newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat_list') {
          setChats(data.chats);
        } else if (data.type === 'chat_messages') {
          setMessages(data.messages);
        } else if (data.type === 'new_message') {
          setMessages(prev => [...prev, data.message]);
          updateChatWithNewMessage(data.message);
        } else if (data.type === 'message_read') {
          updateReadStatus(data.message_ids);
        }
      };

      newSocket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current += 1;
          setTimeout(connectWebSocket, delay);
        }
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    };

    connectWebSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [user?.id, user?.user_type]);

  const sendMessage = (content: string, receiverId: string) => {
    if (!socket || !isConnected || !user?.id) return;

    const message = {
      type: 'send_message',
      sender_id: user.id,
      receiver_id: receiverId,
      content,
      timestamp: new Date().toISOString(),
    };

    socket.send(JSON.stringify(message));
  };
  
  const updateChatWithNewMessage = (message: Message) => {
    if (!user?.id) return;
  
    setChats(prevChats => {
      const updatedChats = [...prevChats];
      const chatIndex = updatedChats.findIndex(chat => {
        // Check both participant and direct doctor/patient IDs
        const participantMatch = chat.participant?.id === (user.id === message.sender_id ? message.receiver_id : message.sender_id);
        const doctorPatientMatch = 
          (chat.patient.id === message.sender_id && chat.doctor.id === message.receiver_id) ||
          (chat.doctor.id === message.sender_id && chat.patient.id === message.receiver_id);
        
        return participantMatch || doctorPatientMatch;
      });
  
      if (chatIndex !== -1) {
        const chat = updatedChats[chatIndex];
        updatedChats[chatIndex] = {
          ...chat,
          last_message: message,
          unread_count: user.id === message.sender_id ? 0 : (chat.unread_count || 0) + 1,
        };
      } else {
        const newChat: Chat = {
          id: message.id, // Temporary ID
          patient: {
            id: user.user_type === 'patient' ? user.id : message.sender_id,
            name: user.user_type === 'patient' ? user.full_name : 'New Patient',
            profile_pic: user.user_type === 'patient' ? user.profile_pic || null : null,
            user_type: 'patient'
          },
          doctor: {
            id: user.user_type === 'doctor' ? user.id : message.sender_id,
            name: user.user_type === 'doctor' ? user.full_name : 'New Doctor',
            profile_picture: user.user_type === 'doctor' ? user.profile_pic || null : null,
            user_type: 'doctor'
          },
          last_message: message,
          unread_count: user.id === message.sender_id ? 0 : 1,
          participant: {
            id: user.id === message.sender_id ? message.receiver_id : message.sender_id,
            name: 'New Participant',
            profile_pic: null,
            user_type: user.user_type === 'patient' ? 'doctor' : 'patient',
          }
        };
        updatedChats.unshift(newChat);
      }
  
      return updatedChats.sort((a, b) => {
        const timeA = a.last_message ? new Date(a.last_message.timestamp).getTime() : 0;
        const timeB = b.last_message ? new Date(b.last_message.timestamp).getTime() : 0;
        return timeB - timeA;
      });
    });
  };
  const updateReadStatus = (messageIds: string[]) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
      )
    );
  };

  const markMessagesAsRead = (chatId: string) => {
    if (!socket || !isConnected || !user || !currentChat) return;
  
    // Get the other participant's ID (either from participant field or doctor/patient fields)
    const otherParticipantId = currentChat.participant?.id || 
      (user.user_type === 'patient' ? currentChat.doctor.id : currentChat.patient.id);
  
    const unreadMessages = messages.filter(
      msg => !msg.is_read && 
      ((msg.sender_id === otherParticipantId && msg.receiver_id === user.id) ||
       (msg.receiver_id === otherParticipantId && msg.sender_id === user.id))
    );
  
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id);
      socket.send(JSON.stringify({
        type: 'mark_as_read',
        message_ids: messageIds,
      }));
  
      updateReadStatus(messageIds);
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chatId ? { ...chat, unread_count: 0 } : chat
        )
      );
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        messages,
        chats,
        currentChat,
        sendMessage,
        setCurrentChat,
        markMessagesAsRead,
        fetchInitialChats,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);