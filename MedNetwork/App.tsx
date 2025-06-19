// App.tsx
import { ExpoRoot } from 'expo-router';
import { registerRootComponent } from 'expo';
import { AuthProvider } from './context/AuthContext';


const App = () => {
  const ctx = require.context('./app');
  return (
    <AuthProvider>
      <ExpoRoot context={ctx} />
    </AuthProvider>
    
  );
};

registerRootComponent(App);