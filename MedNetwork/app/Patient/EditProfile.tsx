import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import defaultAvatar from '../../assets/images/default-avatar.jpeg';
import { useAuth } from '../../context/AuthContext';
import config from '../../src/config/config';

interface PatientProfileData {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  age: string;
  gender: string;
  address: string;
  profile_pic: string;
  [key: string]: any;
}

const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function EditPatientProfile() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePic, setProfilePic] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [originalProfileData, setOriginalProfileData] = useState<Partial<PatientProfileData>>({});
  const [profileData, setProfileData] = useState<PatientProfileData>({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    age: '',
    gender: '',
    address: '',
    profile_pic: '',
  });

  useEffect(() => {
    fetchPatientProfile();
  }, []);

  const fetchPatientProfile = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/patients/${user?.id}/`);
      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      setProfileData(prev => ({
        ...prev,
        ...data,
        age: data.age?.toString() || '',
      }));
      setOriginalProfileData(data);

      if (data.profile_pic) {
        setProfilePic({
          uri: data.profile_pic,
          width: 100,
          height: 100,
          mimeType: 'image/jpeg'
        } as ImagePicker.ImagePickerAsset);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to fetch patient profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof PatientProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera roll permissions are required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfilePic(result.assets[0]);
      setUploadMessage('Profile picture added ✅');
      setTimeout(() => setUploadMessage(''), 3000);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      
      // Add all fields to formData except profile_pic
      Object.entries(profileData).forEach(([key, value]) => {
        if (key === 'profile_pic') return;
        formData.append(key, value?.toString() || '');
      });

      // Handle profile picture upload
      if (profilePic) {
        const fileName = `profile.${profilePic.uri.split('.').pop() || 'jpg'}`;
        const mimeType = profilePic.mimeType || 'image/jpeg';

        let imageFile: any;
        if (Platform.OS === 'web') {
          const response = await fetch(profilePic.uri);
          const blob = await response.blob();
          imageFile = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
        } else {
          imageFile = {
            uri: profilePic.uri,
            name: fileName,
            type: mimeType,
          };
        }
        formData.append('profile_pic', imageFile);
      }

      const response = await fetch(`${config.BASE_URL}/api/patients/${user?.id}/`, {
        method: 'PATCH',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData) || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      
      // Update auth context with new data
      await login({
        ...user,
        full_name: updatedProfile.full_name,
        email: updatedProfile.email,
        profile_pic: updatedProfile.profile_pic,
        phone: updatedProfile.phone
      }, 'patient');

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Profile update failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.heading}>Edit Patient Profile</Text>

      <View style={styles.profilePictureContainer}>
        <Image
          source={profilePic ? { uri: profilePic.uri } : defaultAvatar}
          style={styles.profilePicture}
        />
        <TouchableOpacity onPress={pickImage}>
          <Text style={styles.changeImageText}>Change Photo</Text>
        </TouchableOpacity>
        {!!uploadMessage && <Text style={styles.successMessage}>{uploadMessage}</Text>}
      </View>

      {[
        { key: 'full_name', label: 'Full Name*' },
        { key: 'email', label: 'Email*', editable: false },
        { key: 'phone', label: 'Phone' },
        { key: 'date_of_birth', label: 'Date of Birth (YYYY-MM-DD)' },
        { key: 'age', label: 'Age' },
        { key: 'address', label: 'Address', multiline: true },
      ].map(({ key, label, editable = true, multiline = false }) => (
        <View key={key} style={styles.inputGroup}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={[styles.input, multiline && styles.multilineInput]}
            value={profileData[key]}
            onChangeText={(text) => handleChange(key, text)}
            placeholder={label}
            editable={editable}
            multiline={multiline}
            placeholderTextColor="#999"
          />
        </View>
      ))}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.radioGroup}>
          {genderOptions.map((gender) => (
            <TouchableOpacity 
              key={gender} 
              style={styles.radioOption}
              onPress={() => handleChange('gender', gender)}
            >
              <View style={styles.radioCircle}>
                {profileData.gender === gender && <View style={styles.selectedRadio} />}
              </View>
              <Text style={styles.radioLabel}>{gender}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isSaving}
      >
        <Text style={styles.submitText}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#333' },
  profilePictureContainer: { alignItems: 'center', marginBottom: 24 },
  profilePicture: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#ddd' },
  changeImageText: { color: '#007AFF', marginTop: 8, fontWeight: '500' },
  successMessage: { color: 'green', marginTop: 4, fontSize: 12 },
  inputGroup: { marginBottom: 16 },
  label: { fontWeight: '600', marginBottom: 6, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  selectedRadio: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  radioLabel: {
    fontSize: 16,
  },
  submitButton: { 
    backgroundColor: '#0066CC', 
    padding: 16, 
    borderRadius: 10, 
    marginTop: 24, 
    marginBottom: 20 
  },
  submitText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    textAlign: 'center', 
    fontSize: 16 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
});