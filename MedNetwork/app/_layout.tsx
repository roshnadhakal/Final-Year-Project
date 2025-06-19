import { Stack } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../app/Doctor/NotificationContext';

// Keep splash screen visible until fonts are loaded
SplashScreen.preventAutoHideAsync();

function AuthLayout() {
  const { user } = useAuth();

  return (
    <Stack>
      {/* Public routes */}
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="LoginScreen" 
        options={{ 
          title: 'Login',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="WelcomeScreen" 
        options={{ 
        headerShown: false 
      }} 
    />

      {/* Protected patient routes */}
      {user?.user_type === 'patient' && (
        <>
          <Stack.Screen 
            name="/Patient/FeedScreen" 
            options={{ 
              title: 'Patient Feed',
              headerShown: false
            }} 
          />
          {/* Add Chat routes for patient */}
          <Stack.Screen 
            name="Chat/ChatListScreen" 
            options={{ 
              title: 'Messages',
              headerShown: false
            }} 
        />
        <Stack.Screen 
            name="Chat/[id]" 
            options={{ 
              title: 'Chat',
              headerShown: false
            }} 
          />
        </>
      )}

      {/* Protected doctor routes */}
      {user?.user_type === 'doctor' && (
        <>
          <Stack.Screen 
            name="/Doctor/DoctorFeed" 
            options={{ 
              title: 'Doctor Feed',
              headerShown: false
            }} 
          />
          {/* Add Chat routes for doctor */}
          <Stack.Screen 
            name="Chat/ChatListScreen" 
            options={{ 
              title: 'Messages',
              headerShown: false
            }} 
          />
          <Stack.Screen 
            name="Chat/[id]" 
            options={{ 
              title: 'Chat',
              headerShown: false
            }} 
          />
        </>
      )}

      {/* Add other screens here */}
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <NotificationProvider>
        <AuthLayout />
      </NotificationProvider>
    </AuthProvider>
  );
}