// components/ProtectedRoute.tsx
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requiredUserType }: {
  children: React.ReactNode;
  requiredUserType: 'patient' | 'doctor';
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/LoginScreen" />;
  }

  if (user.user_type !== requiredUserType) {
    return <Redirect href={user.user_type === 'patient' ? '/FeedScreen' : '/DoctorFeed'} />;
  }

  return <>{children}</>;
};