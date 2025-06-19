import { styles } from '@css/confirm';
import React, { useEffect,useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Ionicons } from '@expo/vector-icons';
import config from '../../src/config/config';
import { useAuth } from '../../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const Confirm = () => {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const patientId = user?.id;
  const doctorId = params.doctorId
  const doctorName = params.doctorName as string || 'Dr. Unknown';
  const qualification = params.qualification as string || '';
  const specialization = params.specialization as string || 'General Practitioner';
  const appointmentDate = params.appointmentDate as string || 'Not specified';
  const appointmentTime = params.appointmentTime as string || 'Not specified';
  const appointmentType = params. appointmentType as string || 'Not specified';
  const patientName = params.patientName as string || '';
  const patientAge = params.patientAge as string || '';
  const patientGender = params.patientGender as string || '';
  const problemDescription = params.problemDescription as string || '';
  const bookingFor = params.bookingFor as string || 'Myself';
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [showDatePicker, setShowDatePicker] = useState(false);


  const handleReturnToFeed = () => {
    router.replace('/Patient/FeedScreen');
  };


  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setShowTimePicker(false);
    setDate(currentDate);
    
    if (mode === 'date') {
      setShowTimePicker(true);
      setMode('time');
    } else {
      const formattedDate = currentDate.toLocaleDateString();
      const formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setRescheduleTime(`${formattedDate} at ${formattedTime}`);
    }
  };


  const showMode = (currentMode: 'date' | 'time') => {
    setMode(currentMode);
    if (currentMode === 'date') {
      setShowDatePicker(true);
    } else {
      setShowTimePicker(true);
    }
  };


  const handleReschedule = async () => {
    if (!rescheduleTime) {
      alert('Please select a new appointment time');
      return;
    }

    try {
      // First, update the appointment status to 'rescheduled'
      const updateResponse = await fetch(`${config.BASE_URL}/api/appointments/${params.appointmentId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rescheduled',
          rescheduled_time: rescheduleTime,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update appointment status');
      }

      // Then send notification to patient
      const notificationResponse = await fetch(`${config.BASE_URL}/api/notifications/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: patientId,
          sender: doctorId,
          message: `Your appointment with Dr. ${doctorName} has been rescheduled to ${rescheduleTime}`,
          notification_type: 'appointment_rescheduled',
          related_appointment: params.appointmentId,
        }),
      });

      if (!notificationResponse.ok) {
        throw new Error('Failed to send notification');
      }

      alert('Appointment rescheduled successfully! Notification sent to patient.');
      router.replace('/Patient/FeedScreen');
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      alert('Failed to reschedule appointment. Please try again.');
    }
  };

  const handleAccept = async () => {
    try {
      // Update appointment status to 'confirmed'
      const updateResponse = await fetch(`${config.BASE_URL}/api/appointments/${params.appointmentId}/confirm/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to confirm appointment');
      }

      // Send notification to patient
      const notificationResponse = await fetch(`${config.BASE_URL}/api/notifications/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: patientId,
          sender: doctorId,
          message: `Your appointment with Dr. ${doctorName} has been confirmed for ${appointmentDate} at ${appointmentTime}`,
          notification_type: 'appointment_confirmed',
          related_appointment: params.appointmentId,
        }),
      });

      if (!notificationResponse.ok) {
        throw new Error('Failed to send notification');
      }

      alert('Appointment confirmed! Notification sent to patient.');
      router.replace('/Patient/FeedScreen');
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('Failed to confirm appointment. Please try again.');
    }
  };


  
  useEffect(() => {
    const createAppointmentRequest = async () => {
      try {
        // Validate required fields
        const doctorId = params.doctorId as string;
        
        if (!doctorId) {
          console.error('Doctor ID is missing');
          alert('Doctor ID is missing');
          return;
        }
        
        if (!user?.id) {
          console.error('Patient not authenticated');
          alert('Please login to book an appointment');
          return;
        }
  
        const response = await fetch(`${config.BASE_URL}/api/appointment-requests/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            
          },
          body: JSON.stringify({
            doctor: doctorId,
            patient: user.id,
            doctor_name: doctorName,
            specialization: specialization,
            booking_for: bookingFor,
            full_name: patientName,
            age: patientAge,
            gender: patientGender,
            reason_of_visit: problemDescription,
            booked_on: appointmentDate,
            appointmentType: appointmentType,
            appointment_time: appointmentTime,
            status: 'pending'
          }),
        });
  
        // First check if response is HTML (error page)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('text/html') !== -1) {
          const text = await response.text();
          throw new Error(`Server returned HTML error page: ${text.substring(0, 100)}...`);
        }
  
        // Then try to parse as JSON
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error('API Error:', responseData);
          throw new Error(responseData.message || 'Failed to create appointment request');
        }
        
        console.log('Appointment request created:', responseData);
        
      } catch (error) {
        console.error('Error creating appointment request:', error);
        
      }
    };
  
    createAppointmentRequest();
  }, [params.doctorId, patientId, doctorName, specialization, bookingFor, patientName, 
      patientAge, patientGender, problemDescription, appointmentDate, appointmentTime,appointmentType,appointmentType,]);

  useEffect(() => {
    const updateAppointmentStatus = async () => {
        try {
            const response = await fetch(`${config.BASE_URL}/api/appointments/${params.appointmentId}/confirm/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to confirm appointment');
            }
        } catch (error) {
            console.error('Error confirming appointment:', error);
        }
    };

    if (params.appointmentId) {
        updateAppointmentStatus();
    }
}, [params.appointmentId]);


  return (
    <ProtectedRoute requiredUserType="patient">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Appointment Confirmed</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Doctor Info Section - Now properly receiving data */}
          <View style={styles.doctorInfoContainer}>
            <Text style={styles.doctorName}>Dr. {doctorName}</Text>
            {qualification && (
              <Text style={styles.doctorQualifications}>
                {qualification}
              </Text>
            )}
            <Text style={styles.doctorSpecialty}>
              {specialization}
            </Text>
          </View>

          {/* Appointment Time Section */}
          <View style={styles.appointmentTimeContainer}>
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={20} color="#1e3a8a" />
              <Text style={styles.timeText}>{appointmentTime}</Text>
            </View>
            <View style={styles.dateBadge}>
              <Ionicons name="calendar-outline" size={20} color="#1e3a8a" />
              <Text style={styles.dateText}>{appointmentDate}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Patient Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patient Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking For:</Text>
              <Text style={styles.detailValue}>{bookingFor}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Full Name:</Text>
              <Text style={styles.detailValue}>{patientName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Appointment Type:</Text>
              <Text style={styles.detailValue}>{appointmentType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age:</Text>
              <Text style={styles.detailValue}>{patientAge}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender:</Text>
              <Text style={styles.detailValue}>{patientGender}</Text>
            </View>
          </View>

          {/* Problem Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason for Visit</Text>
            <Text style={styles.problemText}>{problemDescription}</Text>
          </View>

          {/* Reschedule Section (only for doctors) */}
          {user?.user_type === 'doctor' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reschedule Appointment</Text>
              <TouchableOpacity 
                style={styles.timeInputButton}
                onPress={() => showMode('date')}
              >
                <Text style={styles.timeInputButtonText}>
                  {rescheduleTime || 'Select new date and time'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={date}
                  mode={mode}
                  is24Hour={true}
                  display="default"
                  onChange={onChange}
                />
              )}
              
              {showTimePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={date}
                  mode={mode}
                  is24Hour={true}
                  display="default"
                  onChange={onChange}
                />
              )}
            </View>
          )}

          {/* Confirmation Message */}
          <View style={styles.confirmationSection}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            </View>
            <Text style={styles.confirmationText}>Your appointment with Dr. {doctorName} is confirmed!</Text>
            <Text style={styles.confirmationSubtext}>
              You will receive a confirmation from the doctor shortly.
              Please arrive 15 minutes before your scheduled time.
            </Text>
          </View> 
          {/* Action Buttons */}
          {user?.user_type === 'doctor' ? (
            <View style={styles.doctorActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAccept}
              >
                <Text style={styles.actionButtonText}>Accept Appointment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rescheduleButton]}
                onPress={handleReschedule}
              >
                <Text style={styles.actionButtonText}>Reschedule</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>

          {/* Return Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={async () => {
              try {
                const response = await fetch(`${config.BASE_URL}/api/appointment-summary/`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    patient: user?.id,
                    doctor_name: doctorName,
                    specialization: specialization,
                    booking_for: bookingFor,
                    appointmentType: appointmentType,
                    full_name: patientName,
                    age: patientAge,
                    gender: patientGender,
                    reason_of_visit: problemDescription,
                    booked_on: appointmentDate,
                  }),
                });

                if (response.ok) {
                  alert('Appointment summary saved!');
                } else {
                  console.error('Failed to save summary:', await response.text());
                  alert('Failed to save summary.');
                }
              } catch (error) {
                console.error('Error:', error);
                alert('Something went wrong!');
              }
            }}
          >
            <Text style={styles.confirmButtonText}>Confirm Summary</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.returnButton}
            onPress={handleReturnToFeed}
          >
            <Text style={styles.returnButtonText}>Return to Home</Text>
          </TouchableOpacity>
          </>
          )}
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
};
export default Confirm;