import React,{ useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

const DoctorSignUp1 = () => {
  const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');

    const handleNext = () => {
      if (!fullName || !email || !dateOfBirth || !address || !phone) {
        alert('Please fill in all fields');
        return;
      }

      router.push({
        pathname: '/Doctor/DoctorSignUp2',
        params: {
          fullName,
          email,
          dateOfBirth,
          address,
          phone
        }
      });
    };
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Doctor Signup</Text>

      <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
      <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Date of Birth" value={dateOfBirth} onChangeText={setDateOfBirth} />
      <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      
      <Text style={styles.step}>Step 1 of 5</Text>

      <TouchableOpacity style={styles.button} onPress= {handleNext}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>

      <Text style={styles.terms}>
        By continuing, you agree to{" "}
        <Text style={styles.link}>Terms of Use</Text> and{" "}
        <Text style={styles.link}>Privacy Policy</Text>.
      </Text>
    </ScrollView>
  );
};

export default DoctorSignUp1;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007BFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  step: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#666',
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    color: '#444',
    marginTop: 16,
  },
  link: {
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
});
