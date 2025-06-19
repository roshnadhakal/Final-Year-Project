import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import config from '../../src/config/config';

interface ChatEntry {
  id: number;
  patient_name: string;
  patient_id: number;
  patient_profile_pic: string | null;
}

export default function DoctorChatListScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<ChatEntry[]>([]);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/doctor/${user?.id}/chats/`);
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
        patientId: patientId.toString(),
        doctorId: user?.id.toString(),
      }
    });
  };

  const renderItem = ({ item }: { item: ChatEntry }) => (
    <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item.patient_id)}>
      <Image
        source={{ uri: `${config.BASE_URL}${item.patient_profile_pic}`|| 'https://via.placeholder.com/100x100?text=Patient' }}
        style={styles.profileImage}
      />
      <Text style={styles.patientName}>{item.patient_name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Chats</Text>
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
  patientName: { fontSize: 16, fontWeight: '600', color: '#1e3a8a' },
});
