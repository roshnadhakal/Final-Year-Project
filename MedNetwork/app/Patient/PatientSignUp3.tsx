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

const PatientSignUp4 = () => {
  const router = useRouter();
  const {
    fullName,
    email,
    dateOfBirth,
    address,
    phone,
    age,
    gender,
    disease,
  } = useLocalSearchParams();

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

      formData.append('full_name', fullName as string);
      formData.append('email', email as string);
      formData.append('phone', phone as string);
      formData.append('date_of_birth', isoDate);
      formData.append('age', age as string);
      formData.append('gender', gender as string);
      formData.append('address', address as string);
      formData.append('password', password);
      formData.append('disease', disease as string);

      // ✅ Append image
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

      const res = await fetch(`${config.BASE_URL}/api/signup/`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('Signup response:', res.status, data);

      if (res.ok) {
        router.push({
          pathname: '/Patient/EmailVerificationScreen',
          params: { email: email as string },
        });
      } else {
        const messages = Object.entries(data.errors || {}).map(
          ([field, errors]: [string, any]) => `${field}: ${errors.join(', ')}`
        );
        Alert.alert('Signup Failed', messages.join('\n') || data.error || 'Unknown error');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
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

export default PatientSignUp4;
