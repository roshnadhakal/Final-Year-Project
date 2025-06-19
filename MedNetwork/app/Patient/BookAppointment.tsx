import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Ionicons } from '@expo/vector-icons';
import config from '../../src/config/config';
import { useAuth } from '../../context/AuthContext';
import PayPalWebView from './PayPalWebView';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const AppointmentBooking = () => {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [bookingFor, setBookingFor] = useState('myself');
  const [dates, setsDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');
  const [showPayPal, setShowPayPal] = useState(false);
  const [appointmentType, setAppointmentType] = useState('Physical');


  const doctorId = params.doctorId as string;
  const doctorName = params.doctorName as string;
  const qualification = params.qualification as string;
  const specialization = params.specialization as string;
  const physicalFee = params.physicalFee as string;
  const onlineFee = params.onlineFee as string;

  const amount = appointmentType === 'Physical' ? physicalFee : onlineFee;

  const handleConfirmDate = (selectedDate: Date) => {
    setsDate(selectedDate);
    setDatePickerVisibility(false);
  };

  const handleConfirm = async () => {
    if (!selectedTime || !patientName || !patientAge || !patientGender || !problemDescription) {
      Alert.alert('Missing Information', 'Please fill all the fields');
      return;
    }

    // Basic time format validation
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    if (!timeRegex.test(selectedTime)) {
      Alert.alert('Invalid Time Format', 'Please enter time in HH:MM AM/PM format (e.g., 09:30 AM)');
      return;
    }

    setLoading(true);
    
    try {
      const appointmentData = {
        doctor_id: params.doctorId,
        patient_id: user?.id,
        appointment_date: date,
        appointment_time: selectedTime,
        appointment_type: appointmentType,
        patient_name: patientName,
        patient_age: patientAge,
        patient_gender: patientGender,
        problem_description: problemDescription,
      };

      const response = await fetch(`${config.BASE_URL}/api/appointments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        throw new Error('Failed to book appointment');
      }

      const result = await response.json();
      // This is now handled in the PayPal onSuccess callback
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredUserType="patient">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          {/* Doctor Info Section */}
        <View style={styles.doctorInfoContainer}>
          <Text style={styles.doctorName}>
            Dr. {doctorName}, {qualification}
          </Text>
          <Text style={styles.doctorSpecialty}>
            {specialization}
          </Text>
        </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appointment Date</Text>
              <TextInput
                style={styles.input}
                placeholder="Provide date in DD-MM-YYYY format"
                value={date}
                onChangeText={setDate}
                keyboardType="numeric"
              />
          </View>

          {/* Time Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appointment Time</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="Enter time (e.g., 09:30 AM)"
              value={selectedTime}
              onChangeText={setSelectedTime}
            />
            <Text style={styles.noteText}>
              Note: Please select a time during the doctor's availability in previous info page.
            </Text>
          </View>
          {/* Appointment Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appointment Type</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  appointmentType === 'Physical' && styles.radioButtonSelected
                ]}
                onPress={() => setAppointmentType('Physical')}
              >
                <Text style={[
                  styles.radioText,
                  appointmentType === 'Physical' && styles.radioTextSelected
                ]}>
                  Physical
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  appointmentType === 'Online' && styles.radioButtonSelected
                ]}
                onPress={() => setAppointmentType('Online')}
              >
                <Text style={[
                  styles.radioText,
                  appointmentType === 'Online' && styles.radioTextSelected
                ]}>
                  Online
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Booking For */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking For</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  bookingFor === 'myself' && styles.radioButtonSelected
                ]}
                onPress={() => setBookingFor('myself')}
              >
                <Text style={[
                  styles.radioText,
                  bookingFor === 'myself' && styles.radioTextSelected
                ]}>
                  Myself
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  bookingFor === 'other' && styles.radioButtonSelected
                ]}
                onPress={() => setBookingFor('other')}
              >
                <Text style={[
                  styles.radioText,
                  bookingFor === 'other' && styles.radioTextSelected
                ]}>
                  Another Person
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              value={patientName}
              onChangeText={setPatientName}
            />
          </View>

          {/* Age */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter age"
              keyboardType="numeric"
              value={patientAge}
              onChangeText={setPatientAge}
            />
          </View>

          {/* Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gender</Text>
            <View style={styles.radioGroup}>
              {['Male', 'Female', 'Other'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.radioButton,
                    patientGender === gender && styles.radioButtonSelected
                  ]}
                  onPress={() => setPatientGender(gender)}
                >
                  <Text style={[
                    styles.radioText,
                    patientGender === gender && styles.radioTextSelected
                  ]}>
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Problem Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Describe your problem</Text>
            <TextInput
              style={styles.problemInput}
              multiline
              placeholder="Enter your problem here..."
              value={problemDescription}
              onChangeText={setProblemDescription}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.payNowButton}
              onPress={() => setShowPayPal(true)}
            >
              <Text style={styles.buttonText}>Pay Now</Text>
            </TouchableOpacity>
            {showPayPal && (
              <PayPalWebView
                visible={showPayPal}
                onClose={() => setShowPayPal(false)}
                amount={amount}
                onSuccess={(details) => {
                  setShowPayPal(false);
                  // After successful payment, create the appointment and navigate to confirmation
                  handleConfirm().then(() => {
                    router.push({
                      pathname: '/Patient/Confirm',
                      params: {
                        
                        doctorName: doctorName,
                        qualification: qualification,
                        specialization: specialization,
                        appointmentDate: date,
                        appointmentTime: selectedTime,
                        appointmentType: appointmentType,
                        patientName: patientName,
                        patientId: user?.id,
                        patientAge: patientAge,
                        patientGender: patientGender,
                        problemDescription: problemDescription,
                        bookingFor: bookingFor === 'myself' ? 'Myself' : 'Another Person',
                        doctorId: params.doctorId as string,
                        
                      },
                    });
                  }).catch(error => {
                    console.error('Error handling confirmation:', error);
                  });
                }}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#334155',
  },
  instructionText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
    doctorInfoContainer: {
    backgroundColor: '#f0f4ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  noteText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 8,
  },
  timeInput: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  radioButtonSelected: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  radioText: {
    fontSize: 14,
    color: '#334155',
  },
  radioTextSelected: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
  },
  problemInput: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonHalf: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payNowButton: {
    flex: 1,
    backgroundColor: '#10b981', // Emerald green
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppointmentBooking;