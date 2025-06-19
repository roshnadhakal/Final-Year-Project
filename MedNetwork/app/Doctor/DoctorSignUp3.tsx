import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';

const DoctorSignUp3 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get all previous params
  const {
    fullName,
    email,
    dateOfBirth,
    address,
    phone,
    specialization,
    licenseNumber,
    qualification,
    experience,
    currentWorkplace,
  } = params;

  // State for current page fields
  const [availability, setAvailability] = useState({
    online: false,
    physical: false,
  });
  const [workingHours, setWorkingHours] = useState('');
  const [onlineFee, setOnlineFee] = useState('');
  const [physicalFee, setPhysicalFee] = useState('');
  const [feeType, setFeeType] = useState('Both');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const handleNext = () => {
    // Validate required fields
    if (!availability.online && !availability.physical) {
      alert('Please select at least one availability option');
      return;
    }
    
    if ((availability.online && !onlineFee) || (availability.physical && !physicalFee)) {
      alert('Please enter fees for selected availability options');
      return;
    }

    router.push({
      pathname: '/Doctor/DoctorSignUp4',
      params: {
        // Previous params
        fullName,
        email,
        dateOfBirth,
        address,
        phone,
        specialization,
        licenseNumber,
        qualification,
        experience,
        currentWorkplace,
        // Current page params
        availableOnline: availability.online ? 'true' : 'false',
        availablePhysical: availability.physical ? 'true' : 'false',
        workingHours,
        onlineAppointmentFee: onlineFee,
        physicalAppointmentFee: physicalFee,
        feeType,
        additionalInfo,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Doctor Signup</Text>
      <Text style={styles.subTitle}>Complete Appointment requirements</Text>

      {/* Availability */}
      <Text style={styles.label}>Availability</Text>
      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={[styles.checkbox, availability.online && styles.checked]}
          onPress={() => setAvailability(prev => ({ ...prev, online: !prev.online }))}
        />
        <Text style={styles.checkboxLabel}>Online Appointments</Text>
      </View>
      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={[styles.checkbox, availability.physical && styles.checked]}
          onPress={() => setAvailability(prev => ({ ...prev, physical: !prev.physical }))}
        />
        <Text style={styles.checkboxLabel}>Physical Appointments</Text>
      </View>

      <Text style={styles.label}>Working Hours</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 9 a.m to 5 p.m"
        value={workingHours}
        onChangeText={setWorkingHours}
      />

      {availability.online && (
        <>
          <Text style={styles.label}>Online Appointment Fee ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter fee amount"
            keyboardType="numeric"
            value={onlineFee}
            onChangeText={setOnlineFee}
          />
        </>
      )}

      {availability.physical && (
        <>
          <Text style={styles.label}>Physical Appointment Fee ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter fee amount"
            keyboardType="numeric"
            value={physicalFee}
            onChangeText={setPhysicalFee}
          />
        </>
      )}

      <Text style={styles.label}>Fee Type</Text>
      <Picker
        selectedValue={feeType}
        onValueChange={setFeeType}
        style={styles.picker}
      >
        <Picker.Item label="Both" value="Both" />
        <Picker.Item label="Online Only" value="Online" />
        <Picker.Item label="Physical Only" value="Physical" />
      </Picker>

      <Text style={styles.label}>Additional Information (optional)</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Add any additional information"
        multiline
        value={additionalInfo}
        onChangeText={setAdditionalInfo}
      />

      <Text style={styles.stepText}>Step 3 of 5</Text>
      
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

export default DoctorSignUp3;

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
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007bff',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F1F4FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#007bff',
    marginRight: 10,
  },
  checked: {
    backgroundColor: '#007bff',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#000',
  },
  picker: {
    backgroundColor: '#F1F4FF',
    borderRadius: 10,
    marginBottom: 15,
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