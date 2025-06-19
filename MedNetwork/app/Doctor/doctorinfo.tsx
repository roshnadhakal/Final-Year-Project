// E:\MedicalNetworkApp\MedNetwork\app\Doctor\doctorinfo.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Ionicons } from '@expo/vector-icons';
import config from '../../src/config/config';

interface Doctor {
  id: number;
  full_name: string;
  specialization: string;
  profile_picture: string | null;
  experience: number;
  additional_info: string;
  online_appointment_fee: number;
  physical_appointment_fee: number;
  working_hours: string;
  working_days_of_week: string;
  available_online: boolean;
  available_physical: boolean;
  qualification: string;
  current_workplace: string;
  address: string;
}

const DoctorInfoScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [doctor, setDoctor] = React.useState<Doctor | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await fetch(`${config.BASE_URL}/api/doctors/view/${id}/`);
        const data = await response.json();
        setDoctor(data);
      } catch (error) {
        console.error('Error fetching doctor:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.container}>
        <Text>Doctor not found</Text>
      </View>
    );
  }

  return (
    <ProtectedRoute requiredUserType="patient">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doctor Profile</Text>
          <View style={{ width: 24 }} /> {/* Spacer for alignment */}
        </View>

        <ScrollView style={styles.content}>
          {/* Doctor Basic Info */}
          <View style={styles.profileSection}>
            <Image
              source={{
                uri: doctor.profile_picture || 'https://via.placeholder.com/150?text=Doctor',
              }}
              style={styles.profileImage}
            />
            <View style={styles.profileText}>
              <Text style={styles.doctorName}>Dr. {doctor.full_name}, {doctor.qualification}</Text>
              <Text style={styles.specialization}>{doctor.specialization}</Text>
            </View>
          </View>


          {/* Available Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Time</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {doctor.working_hours || '9 A.M to 5 P.M'} - {doctor.working_days_of_week || 'Mon-Sat'}
              </Text>
            </View>
          </View>

          {/* Appointment Charge */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appointment Charge</Text>
            <View style={styles.infoBox}>
              {doctor.available_physical && (
                <Text style={styles.infoText}>
                  Physical Appointment Rs. {doctor.physical_appointment_fee || '800'}
                </Text>
              )}
              {doctor.available_online && (
                <Text style={styles.infoText}>
                  Online Appointment Rs. {doctor.online_appointment_fee || '600'}
                </Text>
              )}
            </View>
          </View>

          {/* Experience */}
          {doctor.experience && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experience</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  {doctor.experience} years of experience
                </Text>
                {doctor.current_workplace && (
                  <Text style={styles.infoText}>
                    Currently at {doctor.current_workplace}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Additional Info */}
          {doctor.additional_info && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About Doctor</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{doctor.additional_info}</Text>
              </View>
            </View>
          )}

          {/* Address */}
          {doctor.address && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{doctor.address}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => router.push({
            pathname: '/Patient/BookAppointment',
            params: {
              doctorId: doctor.id.toString(),
              doctorName: doctor.full_name,
              qualification: doctor.qualification,
              specialization: doctor.specialization,
              physicalFee: doctor.physical_appointment_fee.toString(),
              onlineFee: doctor.online_appointment_fee.toString(),
              // Add any other doctor details you need in the booking flow
            }
          })}
        >
          <Text style={styles.buttonText}>Book Appointment</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style={styles.messageButton}>
          <Text style={styles.buttonText}>Message</Text>
        </TouchableOpacity> */}
      </View>
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'white',
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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 16,
    color: '#334155',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  reviewPlaceholder: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  placeholderText: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  bookButton: {
    backgroundColor: '#1e3a8a',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  messageButton: {
    backgroundColor: '#38bdf8',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DoctorInfoScreen;