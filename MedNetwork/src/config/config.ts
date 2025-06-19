import {  Platform } from 'react-native';

const baseURL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';

export default {
  BASE_URL: baseURL,
  WS_URL: 'wss://your-websocket-url.com/ws/chat/'
};
