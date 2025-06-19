import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import config from '../../src/config/config';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import defaultAvatar from '../../assets/images/default-avatar.jpeg';

interface Doctor {
  id: number;
  full_name: string;
  specialization: string;
  profile_picture: string | null;
  similarity_score?: number;
  matched_conditions?: Array<{
    condition: string;
    score: number;
  }>;
}

const DoctorsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchRecommendedDoctors();
      loadFavorites();
    }
  }, [user?.id]);

  const fetchRecommendedDoctors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.BASE_URL}/api/recommendations/${user?.id}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommended doctors');
      }
      const data = await response.json();
      setDoctors(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recommended doctors:', error);
      // Fallback to regular doctors if recommendation fails
      fetchDoctors();
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/doctors/`);
      const data = await response.json();
      setDoctors(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favoriteDoctors');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (doctorId: number) => {
    try {
      let newFavorites;
      if (favorites.includes(doctorId)) {
        newFavorites = favorites.filter(id => id !== doctorId);
      } else {
        newFavorites = [...favorites, doctorId];
      }
      setFavorites(newFavorites);
      await AsyncStorage.setItem('favoriteDoctors', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getMatchQuality = (score: number) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  };

  const getMatchColor = (score: number) => {
    if (score >= 0.8) return '#4CAF50'; // Green
    if (score >= 0.5) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  return (
    <ProtectedRoute requiredUserType="patient">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recommended Doctors</Text>
          <TouchableOpacity onPress={() => router.push('/Doctor/favourites')}>
            <Ionicons name="heart" size={24} color="#1e3a8a" />
          </TouchableOpacity>
        </View>

        {/* Doctors List */}
        <ScrollView style={styles.content}>
          {loading ? (
            <Text style={styles.loadingText}>Loading recommended doctors...</Text>
          ) : doctors.length > 0 ? (
            doctors.map((doctor) => (
              <View key={doctor.id} style={styles.doctorContainer}>
                <View style={styles.doctorInfo}>
                    <Image
                        source={{
                          uri: doctor.profile_picture 
                            ? `${config.BASE_URL}${doctor.profile_picture}`
                            : Image.resolveAssetSource(defaultAvatar).uri
                        }}
                    style={styles.doctorImage}
                    onError={() => console.log("Error loading doctor image")}
                  />
                  <View style={styles.doctorTextContainer}>
                    <Text style={styles.doctorName}>Dr. {doctor.full_name}</Text>
                    <Text style={styles.doctorSpecialization}>
                      {doctor.specialization}
                    </Text>
                    {doctor.similarity_score !== undefined && (
                      <View style={styles.matchInfo}>
                        <Text style={[styles.matchText, { 
                          color: getMatchColor(doctor.similarity_score) 
                        }]}>
                          Match: {getMatchQuality(doctor.similarity_score)} (
                          {Math.round(doctor.similarity_score * 100)}%)
                        </Text>
                      </View>
                    )}
                    <View style={styles.buttonsRow}>
                      <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => toggleFavorite(doctor.id)}
                      >
                        <Ionicons 
                          name={favorites.includes(doctor.id) ? "heart" : "heart-outline"} 
                          size={24} 
                          color={favorites.includes(doctor.id) ? "red" : "#1e3a8a"} 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => router.push({
                          pathname: '/Chat/ChatScreen',
                          params: { doctorId: doctor.id, patientId: user?.id },
                        })}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#1e3a8a" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.viewButton}
                        onPress={() => router.push(`/Doctor/doctorinfo?id=${doctor.id}`)}
                      >
                        <Text style={styles.viewButtonText}>View</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDoctorsText}>No recommended doctors available</Text>
          )}
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ADD8E6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  doctorContainer: {
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  doctorTextContainer: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1e293b',
  },
  doctorSpecialization: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 5,
  },
  matchInfo: {
    marginBottom: 10,
  },
  matchText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  iconButton: {
    marginRight: 15,
  },
  viewButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#64748b',
  },
  noDoctorsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#64748b',
  },
});

export default DoctorsScreen;