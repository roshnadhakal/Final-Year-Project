import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import defaultAvatar from '../../assets/images/default-avatar.jpeg';
import { useAuth } from '../../context/AuthContext';
import config from '../../src/config/config';

interface DoctorProfileData {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  license_number: string;
  specialization: string;
  qualification: string;
  experience: string;
  current_workplace: string;
  address: string;
  available_online: boolean;
  available_physical: boolean;
  online_appointment_fee: string;
  physical_appointment_fee: string;
  fee_type: string;
  working_hours: string;
  working_days_of_week: string;
  available_on_weekends: boolean;
  weekend_days: string;
  additional_info: string;
  profile_picture: string;
  [key: string]: any;
}

export default function EditDoctorProfile() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePic, setProfilePic] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [originalProfileData, setOriginalProfileData] = useState<Partial<DoctorProfileData>>({});
  const [profileData, setProfileData] = useState<DoctorProfileData>({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    license_number: '',
    specialization: '',
    qualification: '',
    experience: '',
    current_workplace: '',
    address: '',
    available_online: false,
    available_physical: false,
    online_appointment_fee: '',
    physical_appointment_fee: '',
    fee_type: 'Both',
    working_hours: '',
    working_days_of_week: '',
    available_on_weekends: false,
    weekend_days: '',
    additional_info: '',
    profile_picture: '',
  });

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/doctors/${user?.id}/`);
      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      setProfileData(prev => ({
        ...prev,
        ...data,
        experience: data.experience?.toString() || '',
        online_appointment_fee: data.online_appointment_fee?.toString() || '',
        physical_appointment_fee: data.physical_appointment_fee?.toString() || '',
      }));
      setOriginalProfileData(data);

      if (data.profile_picture) {
        setProfilePic({
          uri: data.profile_picture,
          width: 100,
          height: 100,
          mimeType: 'image/jpeg'
        } as ImagePicker.ImagePickerAsset);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to fetch doctor profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof DoctorProfileData, value: any) => {
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
      
      // Add all fields to formData except profile_picture
      Object.entries(profileData).forEach(([key, value]) => {
        if (key === 'profile_picture') return;
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
        formData.append('profile_picture', imageFile);
      }

      const response = await fetch(`${config.BASE_URL}/api/doctors/${user?.id}/`, {
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
        profile_pic: updatedProfile.profile_picture,
        specialization: updatedProfile.specialization,
        phone: updatedProfile.phone
      }, 'doctor');

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
      <Text style={styles.heading}>Edit Doctor Profile</Text>

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
        { key: 'email', label: 'Email*' },
        { key: 'phone', label: 'Phone' },
        { key: 'date_of_birth', label: 'Date of Birth (YYYY-MM-DD)' },
        { key: 'license_number', label: 'License Number', editable: false },
        { key: 'specialization', label: 'Specialization*' },
        { key: 'qualification', label: 'Qualification' },
        { key: 'experience', label: 'Experience (Years)' },
        { key: 'current_workplace', label: 'Current Workplace' },
        { key: 'address', label: 'Address' },
        { key: 'online_appointment_fee', label: 'Online Appointment Fee' },
        { key: 'physical_appointment_fee', label: 'Physical Appointment Fee' },
        { key: 'working_hours', label: 'Working Hours (e.g. 9 a.m to 5 p.m)' },
        { key: 'working_days_of_week', label: 'Working Days (e.g. Monday,Tuesday)' },
        { key: 'weekend_days', label: 'Weekend Days (e.g. Saturday,Sunday)' },
        { key: 'additional_info', label: 'Additional Info', multiline: true },
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

      <View style={styles.switchGroup}>
        <Text>Available Online</Text>
        <Switch
          value={profileData.available_online}
          onValueChange={(val) => handleChange('available_online', val)}
        />
      </View>
      <View style={styles.switchGroup}>
        <Text>Available for Physical Appointment</Text>
        <Switch
          value={profileData.available_physical}
          onValueChange={(val) => handleChange('available_physical', val)}
        />
      </View>
      <View style={styles.switchGroup}>
        <Text>Available on Weekends</Text>
        <Switch
          value={profileData.available_on_weekends}
          onValueChange={(val) => handleChange('available_on_weekends', val)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Fee Type</Text>
        <View style={styles.radioGroup}>
          {['Online', 'Physical', 'Both'].map((type) => (
            <TouchableOpacity 
              key={type} 
              style={styles.radioOption}
              onPress={() => handleChange('fee_type', type)}
            >
              <View style={styles.radioCircle}>
                {profileData.fee_type === type && <View style={styles.selectedRadio} />}
              </View>
              <Text style={styles.radioLabel}>{type}</Text>
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
  switchGroup: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16, 
    paddingVertical: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
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