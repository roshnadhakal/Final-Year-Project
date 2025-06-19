import React, { createContext, useState, useContext, useEffect } from 'react';
import config from '../../src/config/config';
import { useAuth } from '../../context/AuthContext';

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  recipient_id: number;
  recipient_type: string;
  sender : string; // Make optional since it might not always be present
  appointment_request?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  
  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);
  
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      console.log(`Fetching notifications for user ${user.id} (${user.user_type})`);
      
      const response = await fetch(
        `${config.BASE_URL}/api/notifications/?user_id=${user.id}&user_type=${user.user_type}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setNotifications(data);
      
      const unreadResponse = await fetch(
        `${config.BASE_URL}/api/notifications/unread_count/?user_id=${user.id}&user_type=${user.user_type}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!unreadResponse.ok) {
        throw new Error(`HTTP error! status: ${unreadResponse.status}`);
      }
      
      const unreadData = await unreadResponse.json();
      setUnreadCount(unreadData.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  const markAsRead = async (notificationId: number) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${config.BASE_URL}/api/notifications/${notificationId}/mark_as_read/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: Number(user.id), // Ensure number type
          user_type: user.user_type
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await fetch(`${config.BASE_URL}/api/notifications/mark_all_as_read/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({  // Add this
          user_id: Number(user?.id),
          user_type: user?.user_type
        })
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const value: NotificationContextType = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};