import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKEND_DAYS = ['Saturday', 'Sunday'];

const DoctorSignUp4 = () => {
  const router = useRouter();
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
    availableOnline,
    availablePhysical,
    workingHours,
    onlineAppointmentFee,
    physicalAppointmentFee,
    feeType,
    additionalInfo,
  } = useLocalSearchParams();

  // State for current page fields
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [availableOnWeekends, setAvailableOnWeekends] = useState<boolean>(false);
  const [weekendDays, setWeekendDays] = useState<string[]>([]);

  const toggleDay = (day: string) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleWeekendDay = (day: string) => {
    setWeekendDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleNext = () => {
    if (workingDays.length === 0) {
      alert('Please select at least one working day');
      return;
    }

    if (availableOnWeekends && weekendDays.length === 0) {
      alert('Please select at least one weekend day if available on weekends');
      return;
    }

    router.push({
      pathname: '/Doctor/DoctorSignUp5',
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
        currentWorkplace,
        availableOnline,
        availablePhysical,
        workingHours,
        onlineAppointmentFee,
        physicalAppointmentFee,
        feeType,
        additionalInfo,
        // Current page params
        workingDaysOfWeek: workingDays.join(','),
        availableOnWeekends: availableOnWeekends ? 'true' : 'false',
        weekendDays: weekendDays.join(','),
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Doctor Signup</Text>
      <Text style={styles.subTitle}>Select Working Days Of Week</Text>

      {WEEK_DAYS.map(day => (
        <TouchableOpacity
          key={day}
          style={[styles.dayButton, workingDays.includes(day) && styles.selectedDay]}
          onPress={() => toggleDay(day)}
        >
          <Text style={styles.dayButtonText}>{day}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.subTitle}>Are You Available On Weekends?</Text>
      <View style={styles.weekendToggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, availableOnWeekends && styles.toggleButtonActive]}
          onPress={() => setAvailableOnWeekends(true)}
        >
          <Text style={[styles.toggleButtonText, availableOnWeekends && styles.toggleButtonTextActive]}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !availableOnWeekends && styles.toggleButtonActive]}
          onPress={() => setAvailableOnWeekends(false)}
        >
          <Text style={[styles.toggleButtonText, !availableOnWeekends && styles.toggleButtonTextActive]}>No</Text>
        </TouchableOpacity>
      </View>

      {availableOnWeekends && (
        <>
          <Text style={styles.subTitle}>Select Available Weekend Days</Text>
          {WEEKEND_DAYS.map(day => (
            <TouchableOpacity
              key={day}
              style={[styles.dayButton, weekendDays.includes(day) && styles.selectedDay]}
              onPress={() => toggleWeekendDay(day)}
            >
              <Text style={styles.dayButtonText}>{day}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      <Text style={styles.stepText}>Step 4 of 5</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      <Text style={styles.policyText}>
        By continuing, you agree to{' '}
        <Text style={styles.link}>Terms of Use</Text> and{' '}
        <Text style={styles.link}>Privacy Policy</Text>.
      </Text>
    </ScrollView>
  );
};

export default DoctorSignUp4;

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
  subTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007bff',
    marginTop: 15,
    marginBottom: 10,
  },
  dayButton: {
    backgroundColor: '#F1F4FF',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: '#007bff',
  },
  dayButtonText: {
    fontSize: 16,
    color: '#000',
  },
  selectedDayText: {
    color: '#fff',
  },
  weekendToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  toggleButtonActive: {
    backgroundColor: '#007bff',
  },
  toggleButtonText: {
    color: '#007bff',
    fontSize: 16,
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  stepText: {
    textAlign: 'center',
    marginVertical: 15,
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