import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
    id: string;
    full_name: string;
    email: string;
    user_type: 'patient' | 'doctor';
    profile_pic?: string;
    phone?: string;
    // Doctor-specific fields
    specialization?: string;
    license_number?: string;
    qualification?: string;
    experience?: string;
    address?: string;
    available_online?: boolean;
    available_physical?: boolean;
    online_appointment_fee?: string;
    physical_appointment_fee?: string;
    fee_type?: string;
    working_hours?: string;
    working_days_of_week?: string;
    available_on_weekends?: boolean;
    weekend_days?: string;
    additional_info?: string;
    profile_picture?: string;
    password?: string;
    confirmPassword?: string;
    // Add any other common fields
    access_token?: string;
    refresh_token?: string;
    date_of_birth?: string;
    age?: number;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: any, userType: 'patient' | 'doctor') => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const login = async (userData: any, userType: 'patient' | 'doctor') => {
    const userInfo: User = {
      id: userData.id,
      full_name: userData.full_name,
      email: userData.email,
      user_type: userType,
      phone: userData.phone,
      specialization: userData.specialization,
      profile_pic: userData.profile_pic || userData.profile_picture,
      access_token: userData.access_token,
      refresh_token: userData.refresh_token,
    };
    
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);
    } catch (error) {
      console.error('Failed to save user', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear tokens from storage
      await AsyncStorage.multiRemove(['user', 'access_token', 'refresh_token']);
      setUser(null);
    } catch (error) {
      console.error('Failed to logout', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);