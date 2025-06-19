// E:\MedicalNetworkApp\MedNetwork\app\Doctor\favorites.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import config from '../../src/config/config';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Doctor {
  id: number;
  full_name: string;
  specialization: string;
  profile_picture: string | null;
}

const FavoritesScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [favoriteDoctors, setFavoriteDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavoriteDoctors();
  }, []);

  const fetchFavoriteDoctors = async () => {
    try {
      // Get favorite doctor IDs from AsyncStorage
      const storedFavorites = await AsyncStorage.getItem('favoriteDoctors');
      if (!storedFavorites) {
        setLoading(false);
        return;
      }

      const favoriteIds = JSON.parse(storedFavorites);
      
      // Fetch all doctors
      const response = await fetch(`${config.BASE_URL}/api/doctors/`);
      const allDoctors = await response.json();
      
      // Filter to only favorite doctors
      const favorites = allDoctors.filter((doctor: Doctor) => 
        favoriteIds.includes(doctor.id)
      );
      
      setFavoriteDoctors(favorites);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching favorite doctors:', error);
      setLoading(false);
    }
  };

  const removeFavorite = async (doctorId: number) => {
    try {
      const updatedFavorites = favoriteDoctors.filter(doctor => doctor.id !== doctorId);
      setFavoriteDoctors(updatedFavorites);
      
      // Update AsyncStorage
      const favoriteIds = updatedFavorites.map(doctor => doctor.id);
      await AsyncStorage.setItem('favoriteDoctors', JSON.stringify(favoriteIds));
    } catch (error) {
      console.error('Error removing favorite:', error);
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
          <Text style={styles.headerTitle}>Favorite Doctors</Text>
          <View style={{ width: 24 }} /> {/* Spacer for alignment */}
        </View>

        {/* Favorite Doctors List */}
        <ScrollView style={styles.content}>
          {loading ? (
            <Text style={styles.loadingText}>Loading favorite doctors...</Text>
          ) : favoriteDoctors.length > 0 ? (
            favoriteDoctors.map((doctor) => (
              <View key={doctor.id} style={styles.doctorContainer}>
                <View style={styles.doctorInfo}>
                  <Image
                    source={{
                      uri: doctor.profile_picture || 'https://via.placeholder.com/150?text=Doctor',
                    }}
                    style={styles.doctorImage}
                    onError={() => console.log("Error loading doctor image")}
                  />
                  <View style={styles.doctorDetails}>
                    <Text style={styles.doctorName}>Dr. {doctor.full_name}</Text>
                    <Text style={styles.doctorSpecialization}>
                      {doctor.specialization}
                    </Text>
                  </View>
                </View>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.iconButton}
                    onPress={() => removeFavorite(doctor.id)}
                  >
                    <Ionicons name="heart" size={24} color="red" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => router.push(`/Doctor/doctorinfo?id=${doctor.id}`)}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDoctorsText}>No favorite doctors yet</Text>
          )}
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
  doctorContainer: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  doctorSpecialization: {
    fontSize: 14,
    color: '#334155',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 10,
  },
  viewButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  viewButtonText: {
    color: 'white',
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

export default FavoritesScreen;