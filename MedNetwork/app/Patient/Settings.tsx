import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';

interface SettingsProps {
  isVisible: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isVisible, onClose }) => {
  const router = useRouter();
  
  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />
      <View style={styles.settingsContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Settings</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#1e3a8a" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.menuItem}>
          <MaterialIcons name="person-outline" size={24} color="#1e3a8a" />
          <Link href="/Patient/EditProfile" asChild>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>
          </Link>
        </View>
        
        {/* <View style={styles.menuItem}>
          <Ionicons name="heart-outline" size={24} color="#1e3a8a" />
          <Link href="/Patient/Favourites" asChild>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuText}>Favorites</Text>
            </TouchableOpacity>
          </Link>
        </View> */}
        
        {/* <View style={styles.menuItem}>
          <Feather name="shield" size={20} color="#1e3a8a" />
          <Link href="/Patient/PrivacyPolicy" asChild>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuText}>Privacy Policy</Text>
            </TouchableOpacity>
          </Link>
        </View> */}
        
        {/* <View style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color="#1e3a8a" />
          <Link href="/Patient/Notification" asChild>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuText}>Notification</Text>
            </TouchableOpacity>
          </Link>
        </View> */}
        
        {/* <View style={styles.menuItem}>
          <Feather name="help-circle" size={24} color="#1e3a8a" />
          <Link href="/Patient/PasswordManager" asChild>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuText}>Password Manager</Text>
            </TouchableOpacity>
          </Link>
        </View> */}

        {/* <View style={styles.menuItem}>
          <Feather name="help-circle" size={24} color="#1e3a8a" />
          <Link href="/Patient/DeleteAccount" asChild>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuText}>Delete Account</Text>
            </TouchableOpacity>
          </Link>
        </View>
         */}
        <View style={styles.menuItem}>
          <Ionicons name="log-out-outline" size={24} color="#1e3a8a" />
          <Link href="/WelcomeScreen" asChild>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    flexDirection: 'row',
    
  },
  overlayTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  settingsContainer: {
    width: '70%',
    backgroundColor:'#ADD8E6',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  menuButton: {
    marginLeft: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#1e293b',
  },
});

export default Settings;