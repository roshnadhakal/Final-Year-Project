import React, { useState, useEffect,useRef } from 'react';
import config from '../../src/config/config';
import * as ImagePicker from 'expo-image-picker';
import { ImageBackground } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Alert, Platform, ScrollView, Image, TouchableOpacity, TextInput, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import defaultAvatar from '../../assets/images/default-avatar.jpeg';
import defaultAvatar2 from '../../assets/images/default-avatar2.png';
import med from '../../assets/images/med4.png';
import { Ionicons, MaterialIcons, FontAwesome, Feather, FontAwesome5 } from '@expo/vector-icons';
import Settings from './Settings'; 
import NotificationComponent from '../Doctor/NotificationComponent';
import { useNotifications } from '../Doctor/NotificationContext';

interface Post {
  id: number;
  caption: string;
  image: string | null;
  created_at: string;
  likes_count: number;
  has_liked: boolean;
  user: {
    id: number;
    full_name: string;
    profile_pic: string | null;
  };
}

interface Patient {
  id: number;
  full_name: string;
  profile_pic: string | null;
}

interface Doctor {
  id: number;
  full_name: string;
  specialization: string;
  profile_picture: string | null;
  qualification: string;
  experience: string;
  similarity_score: number;
}


interface GradientTextProps {
  children: React.ReactNode;
}

const FeedScreen = () => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'doctors' | 'favorites'>('favorites');
  const [showConnections, setShowConnections] = useState(true);
  const [showDoctors, setShowDoctors] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [recommendedDoctors, setRecommendedDoctors] = useState<Doctor[]>([]);
  const { fetchNotifications } = useNotifications();



  useEffect(() => {
    fetchPatientData();
    fetchPosts();
    if (user?.id) {
      fetchRecommendedDoctors(Number(user.id));
    }
  fetchNotifications();
  const notificationInterval = setInterval(fetchNotifications, 30000);
  return () => {
    clearInterval(notificationInterval);
  };
}, [user?.id]);


  const fetchRecommendedDoctors = async (patientId: number) => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/recommendations/${patientId}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommended doctors');
      }
      const data = await response.json();
      setRecommendedDoctors(data);
    } catch (error) {
      console.error('Error fetching recommended doctors:', error);
      // Fallback to regular doctors if recommendation fails
      fetchDoctors();
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/doctors/`);
      const data = await response.json();
      // Add default similarity score of 0 for regular doctors
      const doctorsWithScore = data.map((doctor: any) => ({
        ...doctor,
        similarity_score: 0
      }));
      setRecommendedDoctors(doctorsWithScore);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      Alert.alert('Error', 'Failed to load doctors list');
    }
  };
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };
  
  const fetchPatientData = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/patients/${user?.id}/`, {
      });
      const data = await response.json();
      setPatient(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      Alert.alert('Error', 'Failed to load patient data');
      setLoading(false);
    }
  };


  const fetchPosts = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/posts/`);
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    }
  };

  const handleLike = async (postId: number) => {
    if (!user) {
      Alert.alert('Error', 'You need to be logged in to like posts');
      return;
    }

    try {
      const response = await fetch(`${config.BASE_URL}/api/posts/${postId}/like/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          user_type: user.user_type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to like post');
      }

      const result = await response.json();

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                has_liked: result.has_liked,
                likes_count: result.likes_count || 0, // Ensure we have a number
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post');
    }
  };
  const handleUploadPost = async () => {
    if (!caption) {
      Alert.alert('Missing info', 'Please add a caption.');
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('user', patient?.id?.toString() || '');
  
      if (selectedImage) {
        // For web
        if (Platform.OS === 'web') {
          const response = await fetch(selectedImage);
          const blob = await response.blob();
          formData.append('image', blob, 'post-image.jpg');
        } 
        // For mobile
        else {
          const uriParts = selectedImage.split('.');
          const fileType = uriParts[uriParts.length - 1];
          
          formData.append('image', {
            uri: selectedImage,
            name: `photo.${fileType}`,
            type: `image/${fileType}`,
          } as any);
        }
      }
  
      const response = await fetch(`${config.BASE_URL}/api/posts/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload post');
      }
  
      const newPost = await response.json();
      setPosts(prev => [newPost, ...prev]); // Add new post to beginning of array
      setCaption('');
      setSelectedImage(null);
      setModalVisible(false);
    } catch (error) {
      console.error('Error uploading post:', error);
      Alert.alert('Error', 'Failed to upload post.');
    }
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setSelectedImage(event.target.result as string);
            }
          };
          reader.readAsDataURL(target.files[0]);
        }
      };
      input.click();
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Camera roll permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    }
  };

  const GradientText: React.FC<GradientTextProps> = ({ children }) => (
    <LinearGradient
      colors={['#833AB4', '#C13584', '#E1306C', '#FD1D1D', '#F56040', '#F77737', '#FCAF45']} // Instagram gradient colors
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradientBackground}
    >
      <Text style={styles.gradientText}>{children}</Text>
    </LinearGradient>
  );

  const getSimilarityColor = (score: number) => {
    if (score >= 0.7) return '#4CAF50'; // Green for high similarity
    if (score >= 0.4) return '#FFC107'; // Yellow for medium similarity
    return '#F44336'; // Red for low similarity
  };

  return (
    <ProtectedRoute requiredUserType="patient">
      <View style={styles.container}>
      <ImageBackground
          source={ med}
          style={styles.headerBackground}
          resizeMode="cover"
        >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={{ 
                uri: patient?.profile_pic || user?.profile_pic 
              }}
              style={styles.patientImage}
              onError={() => console.log("Error loading profile image")}
            />
            <View style={styles.userTextContainer}>
              <Text style={styles.appName}>Med-Net</Text>
              <Text style={styles.name}>{patient?.full_name || 'Patient'}</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
          <NotificationComponent />
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowSettings(true)}>
              <View style={styles.iconCircle}>
              <Feather name="more-vertical" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        </ImageBackground>

        {/* Combined Tabs and Search Bar */}
        <View style={styles.tabsAndSearchContainer}>
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'doctors' && styles.activeTab]}
              onPress={() => router.push('/Doctor/doctor')}
            >
              <View style={styles.tabContent}>
                <FontAwesome5 name="user-md" size={16} color={activeTab === 'doctors' ? '#1e3a8a' : '#64748b'} />
                <Text style={[styles.tabText, activeTab === 'doctors' && styles.activeTabText]}>Doctors</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
              onPress={() =>{ 
                setActiveTab('favorites');
                router.push('/Doctor/favourites');
              }}
            >
              <View style={styles.tabContent}>
                <Ionicons name="heart-outline" size={16} color={activeTab === 'favorites' ? '#1e3a8a' : '#64748b'} />
                <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>Favorites</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Search Bar
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search..."
              style={styles.searchInput}
              placeholderTextColor="#64748b"
            />
            <Feather name="search" size={20} color="#64748b" style={styles.searchIcon} />
          </View> */}
        </View>

        <ScrollView ref={scrollViewRef} style={styles.content}>
        {/* Suggested Connections */}
        {/* <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested Connections</Text>
            <TouchableOpacity onPress={() => setShowConnections(!showConnections)}>
              <MaterialIcons 
                name={showConnections ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color="#1e3a8a" 
              />
            </TouchableOpacity>
          </View>
           */}
          {/* {showConnections && (
            <ScrollView horizontal style={styles.horizontalScroll} showsHorizontalScrollIndicator={false}>
              {[...Array(5)].map((_, i) => (
                <View key={i} style={styles.connectionItem}>
                  <View style={styles.connectionCircle}>
                    <Image
                      source={defaultAvatar2}
                      style={styles.connectionImage}
                    />
                  </View>
                  <Text style={styles.connectionName}>User {i+1}</Text>
                </View>
              ))}
            </ScrollView>
          )} */}
        {/* </View> */}

        {/* Recommended Doctors */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <GradientText>Recommended Doctors</GradientText>
              <TouchableOpacity onPress={() => setShowDoctors(!showDoctors)}>
                <MaterialIcons 
                  name={showDoctors ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color="#1e3a8a" 
                />
              </TouchableOpacity>
            </View>
          
          {showDoctors && (
              <ScrollView horizontal style={styles.horizontalScroll} showsHorizontalScrollIndicator={false}>
              {recommendedDoctors.map((doctor) => (
                <TouchableOpacity 
                  key={doctor.id} 
                  style={styles.connectionItem}
                  onPress={() => router.push(`/Doctor/doctorinfo?id=${doctor.id}`)}
                >
                  <View style={styles.connectionCircle}>
                    <Image
                        source={{
                          uri: doctor.profile_picture 
                            ? `${config.BASE_URL}${doctor.profile_picture}`
                            : Image.resolveAssetSource(defaultAvatar).uri
                        }}
                      style={styles.connectionImage}
                    />
                    {doctor.similarity_score > 0 && (
                      <View style={[styles.similarityBadge, { backgroundColor: getSimilarityColor(doctor.similarity_score) }]}>
                        <Text style={styles.similarityText}>
                          {Math.round(doctor.similarity_score * 100)}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.connectionName}>{doctor.full_name}</Text>
                  <Text style={styles.specializationText}>{doctor.specialization}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Recent Posts */}
        <View style={styles.section}>
          <GradientText>Recent Posts</GradientText>
          {posts.length > 0 ? (
            posts.map(post => (
              <View key={post.id} style={styles.post}>
                {post.image && (
                  <Image
                    source={{ uri: post.image }}
                    style={styles.postImage}
                  />
                )}
                <Text style={styles.postCaption}>{post.caption}</Text>
                <View style={styles.postFooter}>
                <TouchableOpacity 
                  style={styles.likeButton}
                  onPress={() => handleLike(post.id)}
                >
                  <Ionicons 
                    name={post.has_liked ? "heart" : "heart-outline"} 
                    size={24} 
                    color={post.has_liked ? "#FF0000" : "#000"} 
                  />
                  <Text style={styles.likeCount}>{post.likes_count}</Text>
                </TouchableOpacity>
                <Text style={styles.postTime}>
                  {new Date(post.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
            ))
          ) : (
            <View style={styles.postPlaceholder}>
              <Ionicons name="images-outline" size={48} color="#cbd5e1" />
              <Text style={styles.postPlaceholderText}>No posts available. Add a post to get started.</Text>
            </View>
          )}
        </View>
      </ScrollView>

        {/* Bottom Navigation */}
        <ImageBackground
          source={ med}
          style={styles.NavBackground}
          resizeMode="cover"
        >
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navButton} onPress={scrollToTop}>
          <View style={styles.iconCircle}>
            <Ionicons name="home" size={24} color="white" />
          </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}onPress={() => router.push('/Chat/PatientChatList')}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
          </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.addButton}>
              <Ionicons name="add" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => router.push('/Patient/schedule')}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>
        </ImageBackground>

        {/* Create Post Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create a Post</Text>

              <TextInput
                placeholder="Write a caption..."
                style={styles.captionInput}
                multiline
                value={caption}
                onChangeText={setCaption}
              />

              <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                <Text style={styles.imagePickerText}>
                  {selectedImage ? 'Change Image' : 'Pick an Image'}
                </Text>
              </TouchableOpacity>

              {selectedImage && (
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={handleUploadPost} style={styles.uploadButton}>
                  <Text style={styles.uploadButtonText}>Upload</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      {showSettings && (
      <Settings 
        isVisible={showSettings} 
        onClose={() => setShowSettings(false)} 
    />
  )}
    </ProtectedRoute>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  similarityBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  similarityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  specializationText: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 4,
  },
  qualificationText: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },
  experienceText: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },
  iconCircle: {
    backgroundColor: '#1e3a8a',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postUserName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerBackground: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'transparent', 
    borderBottomWidth: 1,
    borderBottomColor: '#99f6e4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  likeButton: {
    marginRight: 8,
  },
  likeCount: {
    fontSize: 14,
    color: '#333',
  },
  patientImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderColor: '#2dd4bf',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0000FF', // Blue color
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 20,
    padding: 6,
  },
  tabsAndSearchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ccfbf1',
  },
  tabs: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: 'white',
    marginRight: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    backgroundColor: 'white',
  },
  activeTab: {
    backgroundColor: '#ADD8E6', // Light blue
    borderColor: '#5eead4',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabText: {
    marginLeft: 8,
    color: '#64748b',
    fontWeight: '500',
    fontSize: 14,
  },
  activeTabText: {
    color: '#0000FF', // Blue color
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flex: 1,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: '#ADD8E6',
  },
  searchInput: {
    flex: 1,
    padding: 0,
    marginLeft: 8,
    color: '#0000FF', // Blue color
    fontSize: 14,
  },
  searchIcon: {
    marginRight: 4,
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#E6F2FF', // Light blue
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0000FF', // Blue color
  },
  gradientBackground: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gradientText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  horizontalScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  connectionItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80, 
  },
  connectionCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F2FF', // Light blue
    borderWidth: 2,
    borderColor: '#ADD8E6',
  },
  connectionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  connectionName: {
    marginTop: 8,
    fontSize: 12,
    color: '#0000FF', // Blue color
    fontWeight: '500',
  },
  post: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postCaption: {
    fontSize: 14,
    color: '#0000FF', // Blue color
    marginBottom: 8,
    lineHeight: 20,
  },
  postTime: {
    fontSize: 12,
    color: '#64748b',
  },
  postPlaceholder: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  postPlaceholderText: {
    marginTop: 16,
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
  },
  NavBackground: {
    width: '100%',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'transparent', 
    borderTopWidth: 1,
    borderTopColor: '#ccfbf1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
  },
  addButton: {
    backgroundColor: '#1e3a8a', // Dark blue
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#134e4a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccfbf1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0000FF', // Blue color
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  captionInput: {
    minHeight: 120,
    padding: 16,
    backgroundColor: '#E6F2FF', // Light blue
    borderRadius: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#0000FF', // Blue color
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  uploadButton: {
    backgroundColor: '#16a34a',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  uploadButtonText: {
    marginLeft: 12,
    color: '#0000FF', // Blue color
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  cancelButtonText: {
    color: '#0000FF', 
    fontWeight: '500',
    textAlign: 'left',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  postButton: {
    backgroundColor: '#1e3a8a', // Dark blue
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#134e4a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  postButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  postButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  userTextContainer: {
    marginLeft: 12,
    flexDirection: 'column',
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0000FF', // Blue color
    marginBottom: 2,
  },
  imagePickerButton: {
    backgroundColor: '#1e3a8a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  imagePickerText: {
    color: 'white',
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
});

export default FeedScreen;