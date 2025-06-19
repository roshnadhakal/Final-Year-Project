// app/PatientSignUp2.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const GENDER_CHOICES = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
  { label: 'Prefer not to say', value: 'Prefer not to say' },
  
];

const PatientSignUp2 = () => {
  const router = useRouter();
  const { fullName, email, dateOfBirth, address, phone } = useLocalSearchParams();

  const [disease, setDisease] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const handleNext = () => {
    if (!disease || !age || !gender) {
      alert('Please fill in all fields');
      return;
    }

    router.push({
      pathname: '/Patient/PatientSignUp3',
      params: {
        fullName,
        email,
        dateOfBirth,
        address,
        phone,
        disease,
        age,
        gender,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Patient Signup</Text>

      <Text style={styles.label}>Specify the disease suffered from</Text>
      <Text style={styles.subLabel}>(max 10)</Text>
      <TextInput
        style={styles.input}
        placeholder=""
        value={disease}
        maxLength={350}
        onChangeText={setDisease}
      />

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        placeholder=""
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.genderContainer}>
        {GENDER_CHOICES.map(({ label, value }) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.genderOption,
              gender === value && styles.genderOptionSelected,
            ]}
            onPress={() => setGender(value)}
          >
            <Text
              style={[
                styles.genderOptionText,
                gender === value && styles.genderOptionTextSelected,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.stepText}>Step 2 of 3</Text>

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>

      <Text style={styles.policyText}>
        By continuing, you agree to{' '}
        <Text style={styles.link}>Terms of Use</Text> and{' '}
        <Text style={styles.link}>Privacy Policy</Text>.
      </Text>
    </ScrollView>
  );
};

export default PatientSignUp2;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#007bff',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  subLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F1F4FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  genderOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  genderOptionSelected: {
    backgroundColor: '#007bff',
  },
  genderOptionText: {
    color: '#333',
    fontSize: 16,
  },
  genderOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  stepText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#888',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  policyText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#444',
    marginTop: 10,
  },
  link: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});
