import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const SignUpScreen = () => {
     const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hello!</Text>
      <Text style={styles.title}>Join Med-Net</Text>
      <Text style={styles.subtext}>Connect, share, and heal with a community that cares!</Text>

      <Text style={styles.question}>Are You A Doctor Or Patient?</Text>

      <TouchableOpacity style={styles.roleButton} onPress={() => router.push('/Patient/PatientSignUp1')}>
        <Text style={styles.roleText}>Patient</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.roleButton} onPress={() => router.push('/Doctor/DoctorSignUp1')}>
        <Text style={styles.roleText}>Doctor</Text>
      </TouchableOpacity>

      {/* <Text style={styles.or}>or sign up with</Text>
      <View style={styles.iconRow}>
        <View style={styles.icon} />
        <View style={styles.icon} />
        <View style={styles.icon} />
      </View> */}

      <Text style={styles.footer}>already have an account? 
      <TouchableOpacity onPress={() => router.push('/LoginScreen')}>
          <Text style={styles.link}> Log in</Text>
        </TouchableOpacity>
      </Text>
    </View>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  header: { fontSize: 20, color: '#007BFF', textAlign: 'center', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', marginTop: 30, color: '#007BFF', textAlign: 'center' },
  subtext: { fontSize: 12, color: '#666', marginBottom: 30, textAlign: 'center' },
  question: { textAlign: 'center', fontSize: 14, marginBottom: 20 },
  roleButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 12,
  },
  roleText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  or: { textAlign: 'center', marginVertical: 10 },
  iconRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d6e0ff',
  },
  footer: { textAlign: 'center', fontSize: 13 },
  link: { color: '#007BFF', fontWeight: 'bold' },
});
