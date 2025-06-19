import React, { useState } from 'react';
import config from '../../src/config/config';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Button,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const DoctorSignUp5 = () => {
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
    workingDaysOfWeek,
    availableOnWeekends,
    weekendDays,
  } = useLocalSearchParams();;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePic, setProfilePic] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera roll permissions are required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0]);
      setUploadMessage('Profile picture added ✅');
      setTimeout(() => setUploadMessage(''), 3000);
    }
  };

  const handleCreateAccount = async () => {
    if (!password || !confirmPassword) {
      return Alert.alert('Error', 'Please enter and confirm your password.');
    }

    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match.');
    }

    try {
      const formData = new FormData();
      let isoDate = dateOfBirth as string;
      const parsedDate = new Date(isoDate);
      if (!isNaN(parsedDate.getTime())) {
        isoDate = parsedDate.toISOString().slice(0, 10);
      }

      // Basic Info
      formData.append('full_name', fullName as string);
      formData.append('email', email as string );
      formData.append('phone', phone as string);
      formData.append('date_of_birth', isoDate);
      formData.append('license_number', licenseNumber as string);
      formData.append('specialization', specialization as string);
      formData.append('password', password);

      // Professional Details
      formData.append('qualification', qualification as string);
      formData.append('experience', experience as string);
      if (currentWorkplace) formData.append('current_workplace', currentWorkplace as string);
      formData.append('address', address as string);

      // Appointment Details
      formData.append('available_online', availableOnline as string);
      formData.append('available_physical', availablePhysical as string);
      if (onlineAppointmentFee) formData.append('online_appointment_fee', onlineAppointmentFee as string);
      if (physicalAppointmentFee) formData.append('physical_appointment_fee', physicalAppointmentFee as string);
      formData.append('fee_type', feeType as string);
      if (workingHours) formData.append('working_hours', workingHours as string);

      // Availability & Scheduling
      formData.append('working_days_of_week', workingDaysOfWeek as string);
      formData.append('available_on_weekends', availableOnWeekends as string);
      if (weekendDays) formData.append('weekend_days', weekendDays as string);

      // Extra Info
      if (additionalInfo) formData.append('additional_info', additionalInfo as string);

      // Profile Picture
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

      const res = await fetch(`${config.BASE_URL}/api/doctor/signup/`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('Doctor signup response:', res.status, data);

      if (res.ok) {
        router.push({
          pathname: '/Doctor/DoctorSignUp6',
          params: { email: email as string },
        });
      } else {
        const messages = Object.entries(data.errors || {}).map(
          ([field, errors]: [string, any]) => `${field}: ${errors.join(', ')}`
        );
        Alert.alert('Signup Failed', messages.join('\n') || data.error || 'Unknown error');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    }
  };

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Create Your Password</Text>
  
        <TextInput
          placeholder="Enter Password"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
  
        <TextInput
          placeholder="Confirm Password"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
  
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          <Text style={styles.imagePickerText}>Select Profile Picture</Text>
          {profilePic && (
            <Image
              source={{ uri: profilePic.uri }}
              style={{ width: 100, height: 100, borderRadius: 50, marginTop: 10 }}
            />
          )}
          {uploadMessage !== '' && (
            <Text style={styles.successMessage}>{uploadMessage}</Text>
          )}
        </TouchableOpacity>
  
        <Button title="Create Account" onPress={handleCreateAccount} />
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      padding: 16,
      marginTop: 60,
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
      fontWeight: 'bold',
    },
    input: {
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 10,
      marginBottom: 12,
      padding: 12,
    },
    imagePicker: {
      marginBottom: 20,
    },
    imagePickerText: {
      color: '#007BFF',
      textDecorationLine: 'underline',
    },
    successMessage: {
      color: 'green',
      marginTop: 10,
      fontWeight: 'bold',
    },
  });
  
  export default DoctorSignUp5;
  