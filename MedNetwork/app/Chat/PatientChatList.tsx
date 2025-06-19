// screens/PatientChatListScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import config from '../../src/config/config';


interface ChatEntry {
    id: number;
    doctor_name: string;
    doctor_id: number;
    doctor_profile_picture: string | null;
  }
export default function PatientChatListScreen() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/patients/${user?.id}/chats/`);
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error('Error fetching chat list:', error);
    }
  };

  const openChat = (patientId: number) => {
    router.push({
      pathname: '/Chat/ChatScreen',
      params: {
        patientId: user?.id.toString(),
        doctorId: patientId.toString(),
      }
    });
  };

  const renderItem = ({ item }: { item: ChatEntry }) => (
    <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item.doctor_id)}>
      <Image
        source={{ uri: `${config.BASE_URL}${item.doctor_profile_picture}`|| 'https://via.placeholder.com/100x100?text=Patient' }}
        style={styles.profileImage}
      />
      <Text style={styles.doctorName}>{item.doctor_name}</Text>
    </TouchableOpacity>
  );

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Doctor Chats</Text>
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ADD8E6' },
    title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#e0f2fe',
      padding: 12,
      marginBottom: 12,
      borderRadius: 12,
    },
    profileImage: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
    doctorName: { fontSize: 16, fontWeight: '600', color: '#1e3a8a' },
  });
  


