import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import config from '../../src/config/config';
import { Link, useRouter } from 'expo-router';

type Appointment = {
  id: number;
  doctor_name: string;
  specialization: string;
  created_at: string;
  completed_status: string | null;
};

const ScheduleScreen = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;

      try {
        const response = await axios.get(
          `${config.BASE_URL}/api/appointments/?patient_id=${user.id}`
        );
        setAppointments(response.data);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchAppointments();
    }
  }, [authLoading, user]);

  const markAsCompleted = async (id: number) => {
    Alert.alert(
      'Confirm Completion',
      'Are you sure you want to mark this appointment as completed?',
      [
        { text: 'No' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await axios.patch(
                `${config.BASE_URL}/api/appointments/${id}/`
              );
              setAppointments(prev =>
                prev.map(item =>
                  item.id === id
                    ? { ...item, completed_status: 'Appointment Completed' }
                    : item
                )
              );
            } catch (error) {
              console.error('Error updating appointment:', error);
              Alert.alert('Error', 'Failed to mark appointment as completed.');
            }
          },
        },
      ]
    );
  };

  if (authLoading || loading) {
    return <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Appointments</Text>
      {appointments.length === 0 ? (
        <Text style={styles.noAppointments}>No appointments found.</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>Dr. {item.doctor_name}</Text>
              <Text style={styles.specialization}>{item.specialization}</Text>
              <Text style={styles.date}>
                Booked On: {new Date(item.created_at).toLocaleDateString()}
              </Text>
              
              {item.completed_status && (
                <Text style={styles.completedText}>{item.completed_status}</Text>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => router.push('/Patient/ViewDetails')}
                >
                  <Text style={styles.buttonText}>View Details</Text>
                </TouchableOpacity>

                {/* {!item.completed_status && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => markAsCompleted(item.id)}
                  >
                    <Text style={styles.buttonText}>Mark as Completed</Text>
                  </TouchableOpacity>
                )} */}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default ScheduleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ADD8E6',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  specialization: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  completedText: {
    fontSize: 14,
    color: 'green',
    fontWeight: 'bold',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  detailButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  completeButton: {
    backgroundColor: '#34C759',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  noAppointments: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});