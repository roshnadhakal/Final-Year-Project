import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const WelcomeScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/med-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Med-Net</Text>
      <Text style={styles.subtitle}>Together In Health</Text>

      <Text style={styles.description}>
        Your journey to better health starts here! Connect with others who understand your story,
        share experiences, and find the support you need. Let’s take the first step today!
      </Text>

      <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/LoginScreen')}>
        <Text style={styles.loginText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/SignUpScreen')}>
        <Text style={styles.signupText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

export default WelcomeScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#007BFF',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#007BFF',
    marginBottom: 20,
  },
  description: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  loginButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginTop: 10,
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signupButton: {
    backgroundColor: '#d6e0ff',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginTop: 12,
  },
  signupText: {
    color: '#007BFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
