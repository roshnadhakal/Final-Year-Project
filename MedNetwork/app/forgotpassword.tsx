import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import config from '../src/config/config';
import { useRouter } from 'expo-router';

const ForgotPassword = () => {
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'doctor' | 'patient'>('patient');
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string>('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');  
  const router = useRouter();

  const requestReset = async () => {
    try {
      const res = await fetch(`${config.BASE_URL}/api/request-password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, user_type: userType }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate reset code');
      }
  
    
      setUserId(data.user_id.toString());
      setStep(2);
      
      
      Alert.alert(
        'Reset Code', 
        `Your reset code is: ${data.code || 'Check server console'}`,
        [{ text: 'OK' }]
      );
      
    } catch (err) {
      Alert.alert('Error', 'Failed to generate reset code');
      console.error(err);
    }
  };

  const verifyCodeAndReset = async () => {
    try {
      // Validate inputs
      if (!code || code.length !== 6) {
        Alert.alert('Error', 'Please enter a valid 6-digit code');
        return;
      }
  
      if (!newPassword || newPassword.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
  
      const res = await fetch(`${config.BASE_URL}/api/verify-reset-code/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_type: userType,
          user_id: parseInt(userId),
          code: code,
          new_password: newPassword,
        }),
      });
  
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
  
     
      Alert.alert('Success', 'Password reset successfully!');
      router.replace('/LoginScreen');
      
    } catch (err) {
      Alert.alert('Error', 'Failed to reset password');
      console.error('Reset error:', err);
    }
  };

  return (
    <View style={styles.container}>
      {step === 1 ? (
        <>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Enter your phone number"
          />
          
          <View style={styles.buttonRow}>
            <Button 
              title="Patient" 
              onPress={() => setUserType('patient')} 
              color={userType === 'patient' ? '#4CAF50' : '#9E9E9E'}
            />
            <Button 
              title="Doctor" 
              onPress={() => setUserType('doctor')} 
              color={userType === 'doctor' ? '#4CAF50' : '#9E9E9E'}
            />
          </View>
          
          <Button 
            title="Generate Reset Code" 
            onPress={requestReset}
            color="#2196F3"
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Verification Code (6 digits)</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
          
          <Text style={styles.label}>New Password (6 characters)</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Enter new password"
            maxLength={6}
            
          />
          
          <Button 
            title="Reset Password" 
            onPress={verifyCodeAndReset}
            disabled={!code || code.length !== 6 || !newPassword || newPassword.length < 6}
            color="#2196F3"
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: { 
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 20,
  },
});

export default ForgotPassword;