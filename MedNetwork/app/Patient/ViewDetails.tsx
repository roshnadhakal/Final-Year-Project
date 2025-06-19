import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import config from '../../src/config/config';

type AppointmentDetails = {
  id: number;
  doctor_name: string;
  specialization: string;
  booking_for: string;
  full_name: string;
  age: string;
  gender: string;
  reason_of_visit: string;
  appointment_type: string;
  booked_on: string;
};

const ViewDetails = () => {
  const { user, loading: authLoading } = useAuth();
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!user) return;

      try {
        const response = await axios.get(
           `${config.BASE_URL}/api/appointment-requests/?patient_id=${user.id}`
        );

        if (response.data.length > 0) {
          // You can enhance this to fetch the most recent or specific one
          setAppointment(response.data[response.data.length - 1]);
        }
      } catch (error) {
        console.error('Error fetching appointment details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchAppointmentDetails();
    }
  }, [authLoading, user]);

  if (authLoading || loading) {
    return <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />;
  }

  if (!appointment) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>No appointment details found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Appointment Details</Text>
      <View style={styles.card}>
        <Detail label="Doctor Name" value={`Dr. ${appointment.doctor_name}`} />
        <Detail label="Specialization" value={appointment.specialization} />
        <Detail label="Booking For" value={appointment.booking_for} />
        <Detail label="Patient Name" value={appointment.full_name} />
        <Detail label="Age" value={appointment.age} />
        <Detail label="Gender" value={appointment.gender} />
        <Detail label="Reason of Visit" value={appointment.reason_of_visit} />
        <Detail label="Appointment Type" value={appointment.appointment_type} />
        <Detail
          label="Booked For"
          value={appointment.booked_on}
        />
      </View>
    </ScrollView>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export default ViewDetails;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
  },
  detailRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#555',
    marginTop: 2,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  noData: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
