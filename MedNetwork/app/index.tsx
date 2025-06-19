import { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';

const medLogo = require('../assets/images/med-logo.png');

export default function SplashScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/WelcomeScreen');
    }, 2500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={medLogo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Med-Net</Text>
      <Text style={styles.tagline}>Together In Health</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
  },
});
