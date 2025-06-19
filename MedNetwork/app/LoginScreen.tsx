// app/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import config from '../src/config/config';
import axios from 'axios';

const LoginScreen = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      Alert.alert('Error', 'Please enter both email/phone and password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${config.BASE_URL}/api/login/`, {
        email_or_phone: emailOrPhone,
        password: password
      },{
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        const { user_type, user } = response.data;
        login(user, user_type);
        
      
        if (user_type === 'patient') {
          router.replace('/Patient/FeedScreen');
        } else if (user_type === 'doctor') {
          router.replace('/Doctor/DoctorFeed');
        }
      } else {
        Alert.alert('Error', response.data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Log In</Text>
      <Text style={styles.welcome}>Welcome</Text>
      <Text style={styles.subtext}>Connect, share, and heal with a community that cares!</Text>

      <Text style={styles.label}>Email or Mobile Number</Text>
      <TextInput 
        style={styles.input} 
        placeholder="example@example.com or phone number" 
        placeholderTextColor="#aaa"
        value={emailOrPhone}
        onChangeText={setEmailOrPhone}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput 
        style={styles.input} 
        placeholder="**********" 
        secureTextEntry 
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
        <Text style={styles.forgot} onPress={() => router.push('/forgotpassword')}>Forgot Password</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginText}>
          {loading ? 'Logging in...' : 'Log In'}
        </Text>
      </TouchableOpacity>
{/* 
      <Text style={styles.or}>or sign up with</Text>

      <View style={styles.iconRow}>
        <View style={styles.icon} />
        <View style={styles.icon} />
        <View style={styles.icon} />
      </View> */}

      <Text style={styles.footer}>
        Don't have an account? <Text style={styles.link}onPress={() => router.push('/SignUpScreen')}>Sign Up </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  header: { fontSize: 20, color: '#007BFF', textAlign: 'center', fontWeight: '600' },
  welcome: { fontSize: 18, fontWeight: '700', marginTop: 30, color: '#007BFF' },
  subtext: { fontSize: 12, color: '#666', marginBottom: 30 },
  label: { fontSize: 14, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  forgot: { color: '#007BFF', fontSize: 12 },
  loginButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 20,
  },
  loginText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  or: { textAlign: 'center', marginBottom: 10 },
  iconRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d6e0ff',
  },
  footer: { textAlign: 'center', fontSize: 13 },
  link: { color: '#007BFF', fontWeight: 'bold' },
});
export default LoginScreen;
