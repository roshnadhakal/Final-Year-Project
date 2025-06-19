import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import config from '../../src/config/config';
import { ImageBackground } from 'react-native';
import chat from '../../assets/images/chat.jpg';

type Message = {
  id: number;
  content: string;
  sender_type: 'patient' | 'doctor';
  sender_patient?: string | null;
  sender_doctor?: string | null;
  timestamp: string;
};

const ChatScreen = () => {
  const { doctorId, patientId } = useLocalSearchParams();
  const { user } = useAuth();
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getOrCreateChat();
  }, []);

  useEffect(() => {
    if (chatId) fetchMessages();
  }, [chatId]);

  const getOrCreateChat = async () => {
    try {
      const res = await fetch(`${config.BASE_URL}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: doctorId, patient_id: patientId }),
      });
  
      const text = await res.text();
  
      try {
        const data = JSON.parse(text);
        if (data?.id) {
          setChatId(data.id);
        } else {
          console.error('Invalid response from chat creation', data);
        }
      } catch (jsonError) {
        console.error('Error parsing JSON:', text);
      }
  
    } catch (err) {
      console.error('Error creating chat', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${config.BASE_URL}/api/chat/${chatId}/messages/`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages', err);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const payload = {
      chat: chatId,
      content: message,
      sender_type: user?.user_type,
      sender_patient: user?.user_type === 'patient' ? user.id : null,
      sender_doctor: user?.user_type === 'doctor' ? user.id : null,
    };

    try {
      await fetch(`${config.BASE_URL}/api/chat/${chatId}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setMessage('');
      fetchMessages();
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  return (
    <ImageBackground
    source={chat}
    resizeMode="cover"
    style={styles.backgroundImage}
  >
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.sender_type === user?.user_type ? styles.myMessage : styles.theirMessage
          ]}>
            <Text>{item.content}</Text>
          </View>
        )}
        inverted
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message"
          style={styles.input}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={{ color: 'white' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
    </ImageBackground>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  container: { flex: 1, padding: 10 },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#EEE',
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#CCC',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#1e3a8a',
    padding: 10,
    borderRadius: 20,
  },
});
