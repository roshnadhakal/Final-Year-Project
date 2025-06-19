import React, { useState } from 'react';
import { View, Text, TextInput, Button,StyleSheet, Alert} from 'react-native';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import config from '../../src/config/config';

const DoctorSignUp6: React.FC = () => {
  const [code, setCode] = useState('');
  const router = useRouter();
  const { email } = useLocalSearchParams();

  console.log('Email:', email);
  console.log('Code:', code);
  
  const handleVerify = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the verification code.');
      return;
    }

    try {
      const response = await axios.post(`${config.BASE_URL}/api/doctor/verify/`, {
        email,
        code,
      });
    
      if (response.data.status === 'verified') {
        Alert.alert('Success', 'Your email has been verified!');
        router.push('../WelcomeScreen');
      } else {
        Alert.alert('Failed', response.data.message || 'Verification failed.');
      }
    } catch (error: any) {
      console.error('Verification Error:', error.response?.data || error.message);
      Alert.alert('Verification Error', error.response?.data?.message || error.message);
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await axios.post(`${config.BASE_URL}/api/doctor/resend/`, { email });
      Alert.alert('Code Sent', response.data.message || 'Verification code resent.');
    } catch (error: unknown) {
      let errorMessage = 'An error occurred while resending code.';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      }
      Alert.alert('Error', errorMessage);
    }
  };

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to: {email}</Text>
  
        <TextInput
          placeholder="Enter Code"
          value={code}
          onChangeText={setCode}
          style={styles.input}
          keyboardType="numeric"
          maxLength={6}
        />
  
        <Button title="Verify" onPress={handleVerify} />
        
        <Button title="Resend Code" onPress={handleResendCode} />
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      padding: 20,
      marginTop: 60,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8
    },
    subtitle: {
      fontSize: 16,
      marginBottom: 20,
      color: '#666'
    },
    input: {
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 10,
      marginBottom: 20,
      padding: 12
    }
  });
export default DoctorSignUp6;