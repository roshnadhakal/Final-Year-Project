// app/DoctorSignUp2.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

const DoctorSignUp2 = () => {
  const router = useRouter();
  const { fullName, email, dateOfBirth, address, phone } = useLocalSearchParams();

  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [currentWorkplace, setCurrentWorkplace] = useState('');

  const handleNext = () => {
    if (!specialization || !licenseNumber || !qualification || !experience) {
      alert('Please fill in all required fields');
      return;
    }

    router.push({
      pathname: '/Doctor/DoctorSignUp3',
      params: {
        fullName,
        email,
        dateOfBirth,
        address,
        phone,
        specialization,
        licenseNumber,
        qualification,
        experience,
        currentWorkplace: currentWorkplace || '',
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Doctor Signup</Text>

      <Text style={styles.label}>Specialization</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={specialization}
          onValueChange={(itemValue) => setSpecialization(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Specialty" value="" />
          <Picker.Item label="Asthma" value="Asthma" />
          <Picker.Item label="Hypertension" value="Hypertension" />
          <Picker.Item label="Diabetes" value="Diabetes" />
          <Picker.Item label="Migraine" value="Pediatrics" />
          <Picker.Item label="Arthritis" value="Migraine" />
          <Picker.Item label="PCOS" value="PCOS" />
          <Picker.Item label="Anxiety" value="Anxiety" />
          
        </Picker>
      </View>

      <Text style={styles.label}>License Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. nmc/yyyy/123"
        value={licenseNumber}
        onChangeText={setLicenseNumber}
      />

      <Text style={styles.label}>Qualification</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. MD, MBBS"
        value={qualification}
        onChangeText={setQualification}
      />

      <Text style={styles.label}>Experience (years)</Text>
      <TextInput
        style={styles.input}
        placeholder="Number of years"
        keyboardType="numeric"
        value={experience}
        onChangeText={setExperience}
      />

      <Text style={styles.label}>Current Workplace (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Hospital or clinic name"
        value={currentWorkplace}
        onChangeText={setCurrentWorkplace}
      />

      <Text style={styles.stepText}>Step 2 of 5</Text>

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

export default DoctorSignUp2;

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
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F1F4FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#F1F4FF',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
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