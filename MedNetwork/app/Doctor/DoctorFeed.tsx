import React, { useState, useEffect, useRef } from 'react';
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
import Settings from './settings'; 
import NotificationComponent from '../Doctor/NotificationComponent';

interface AppointmentRequest {
  id: number;
  patient_details: {
    id: number;
    full_name: string;
    profile_pic: string | null;
    user_type: string;
  };
  full_name: string;
  age: string;
  gender: string;
  reason_of_visit: string;
  booked_on: string;
  appointment_time: string;
  appointment_type: string;
  status: 'pending' | 'accepted' | 'rescheduled' | 'completed';
  seen_by_doctor: boolean;
  created_at: string;
  rescheduled_time: string | null; 
}

interface Post {
  id: number;
  caption: string;
  image: string | null;
  created_at: string;
  likes_count: number;
  has_liked: boolean;
  user_name: string;
  user_type: 'patient' | 'doctor';
  user_profile_pic: string | null;
}

interface Doctor {
  id: number;
  full_name: string;
  profile_picture: string | null;
}

interface GradientTextProps {
  children: React.ReactNode;
}

const DoctorFeed = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'appointments' | 'View Feed'>('appointments');
  const [showConnections, setShowConnections] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [newAppointmentTime, setNewAppointmentTime] = useState('');
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);


  const fetchAppointmentRequests = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/appointment-requests/doctor_requests/?doctor_id=${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch appointment requests');
      }
      const data = await response.json();
      setAppointmentRequests(data);
    } catch (error) {
      console.error('Error fetching appointment requests:', error);
      Alert.alert('Error', 'Failed to load appointment requests');
    }
  };


  const handleUpdateStatus = async (requestId: number, newStatus: 'accepted' | 'rescheduled' | 'completed') => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/appointment-requests/${requestId}/update_status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }
  
      // Update the local state
      setAppointmentRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );
      
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      Alert.alert('Success', `Appointment ${newStatus} successfully`);
      
    } catch (error) {
      console.error('Error updating appointment status:', error);
      Alert.alert('Error', 'Failed to update appointment status');
    }
  };

  useEffect(() => {
    fetchDoctorData();
    fetchPosts();
    fetchAppointmentRequests();
  }, []);

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };
  
  const fetchDoctorData = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/doctors/${user?.id}/`, {
      });
      const data = await response.json();
      setDoctor(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      Alert.alert('Error', 'Failed to load doctor data');
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
                  has_liked: result.status === 'liked',
                  likes_count:
                    result.status === 'liked'
                      ? post.likes_count + 1
                      : post.likes_count - 1,
                }
              : post
          )
        );
      } 
     catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post');
    }
  };
  const handleReschedule = async (requestId: number, newTime: string) => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/appointment-requests/${requestId}/reschedule/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rescheduled_time: newTime,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to reschedule appointment');
      }
  
      const updatedRequest = await response.json();
      
      // Update the local state
      setAppointmentRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, rescheduled_time: newTime, status: 'rescheduled' } : req
        )
      );
      
      setRescheduleModalVisible(false);
      setRequestModalVisible(false);
      Alert.alert('Success', 'Appointment rescheduled successfully');
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      Alert.alert('Error', 'Failed to reschedule appointment');
    }
  };

  const handleUploadPost = async () => {
    if (!caption) {
      Alert.alert('Missing info', 'Please add a caption.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to post');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('user_id', user.id.toString());
      formData.append('user_type', user.user_type);

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
        throw new Error(errorData.error || 'Failed to upload post');
      }

      const newPost = await response.json();
      setPosts(prev => [newPost, ...prev]);
      setCaption('');
      setSelectedImage(null);
      setModalVisible(false);
    } catch (error) {
      console.error('Error uploading post:', error);
      Alert.alert('Error',  'Failed to upload post.');
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
      colors={['#833AB4', '#C13584', '#E1306C', '#FD1D1D', '#F56040', '#F77737', '#FCAF45']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradientBackground}
    >
      <Text style={styles.gradientText}>{children}</Text>
    </LinearGradient>
  );

  return (
    <ProtectedRoute requiredUserType="doctor">
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
                uri: doctor?.profile_picture || user?.profile_pic
              }}
              style={styles.doctorImage}
              onError={() => console.log("Error loading profile image")}
            />
            <View style={styles.userTextContainer}>
              <Text style={styles.appName}>Med-Net</Text>
              <Text style={styles.name}>{doctor?.full_name || 'Doctor'}</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
          
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
              style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
              onPress={() => setActiveTab('appointments')}
            >
              <View style={styles.tabContent}>
                <FontAwesome5 name="calendar-check" size={16} color={activeTab === 'appointments' ? '#1e3a8a' : '#64748b'} />
                <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>Appointment Requests</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'View Feed' && styles.activeTab]}
              onPress={() => setActiveTab('View Feed')}
            >
              <View style={styles.tabContent}>
                <Ionicons name="star-outline" size={16} color={activeTab === 'View Feed' ? '#1e3a8a' : '#64748b'} />
                <Text style={[styles.tabText, activeTab === 'View Feed' && styles.activeTabText]}>View Feed</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          {/* <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search..."
              style={styles.searchInput}
              placeholderTextColor="#64748b"
            />
            <Feather name="search" size={20} color="#64748b" style={styles.searchIcon} />
          </View> */}

        </View>

        <ScrollView ref={scrollViewRef} style={styles.content}>
        {activeTab === 'appointments' ? (
          // Appointments tab content
          <View style={styles.appointmentsContainer}>
            {/* <Text style={styles.sectionTitle}>Appointment Requests</Text> */}
            {appointmentRequests.length > 0 ? (
              appointmentRequests.map(request => (
                <View key={request.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <View style={styles.patientInfo}>
                      <Image
                        source={{ uri: request.patient_details.profile_pic || defaultAvatar2 }}
                        style={styles.patientImage}
                      />
                      <View>
                        <Text style={styles.patientName}>{request.full_name}</Text>
                        <Text style={styles.appointmentDate}>
                          {request.booked_on} • {request.appointment_time}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{request.status}</Text>
                    </View>
                  </View>
                  <View style={styles.appointmentActions}>
                  <TouchableOpacity 
                    style={styles.iconButton}
                    onPress={() => router.push({
                      pathname: '/Chat/ChatScreen',
                      params: { doctorId: user?.id, patientId: request?.patient_details?.id },
                    })}
                  >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#1e3a8a" />
              </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.viewDetailsButton}
                      onPress={() => {
                        setSelectedRequest(request);
                        setRequestModalVisible(true);
                      }}
                    >
                      <Text style={styles.viewDetailsText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyStateText}>No appointment requests yet</Text>
              </View>
            )}
          </View>
        ) : (
          <>  
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
            </View> */}
            
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

          {/* Recent Posts */}
          <View style={styles.section}>
            <GradientText>Recent Posts</GradientText>
            {posts.length > 0 ? (
              posts.map(post => (
                <View key={post.id} style={styles.post}>
                  {post.image && (
                    <Image
                    source={{ uri: post.image || (post.user_type === 'patient' ? defaultAvatar : defaultAvatar2) }}
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
          </>
        )}  
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
          <TouchableOpacity style={styles.navButton}onPress={() => router.push('/Chat/DoctorChatListScreen')}>
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
        </View>
        </ImageBackground>

        {/* Add a modal for viewing appointment details */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={requestModalVisible}
          onRequestClose={() => setRequestModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedRequest && (
                <>
                  <Text style={styles.modalTitle}>Appointment Details</Text>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Patient:</Text>
                    <Text style={styles.detailValue}>{selectedRequest.full_name}</Text>
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Age / Gender:</Text>
                    <Text style={styles.detailValue}>{selectedRequest.age} / {selectedRequest.gender}</Text>
                  </View>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Appointment Type:</Text>
                    <Text style={styles.detailValue}>{selectedRequest.appointment_type} </Text>
                  </View>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Booked For:</Text>
                    <Text style={styles.detailValue}>{selectedRequest.booked_on} </Text>
                  </View>
                  <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Date and Time:</Text>
                        <Text style={styles.detailValue}>
                          {selectedRequest.appointment_time}
                        </Text>
                      </View>
                      {selectedRequest.rescheduled_time && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailLabel}>Rescheduled Time:</Text>
                          <Text style={styles.detailValue}>{selectedRequest.rescheduled_time}</Text>
                        </View>
                      )}
                  <View style={styles.reasonSection}>
                    <Text style={styles.detailLabel}>Reason for Visit:</Text>
                    <Text style={styles.reasonText}>{selectedRequest.reason_of_visit}</Text>
                  </View>
                  
                  
                  <View style={styles.statusSection}>
                    <Text style={styles.statusLabel}>Status:</Text>
                    <View style={[
                      styles.statusPill, 
                      selectedRequest.status === 'pending' && styles.pendingStatus,
                      selectedRequest.status === 'accepted' && styles.acceptedStatus,
                      selectedRequest.status === 'rescheduled' && styles.rescheduleStatus,
                      selectedRequest.status === 'completed' && styles.completedStatus,
                    ]}>
                      <Text style={styles.statusPillText}>{selectedRequest.status}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.actionButtons}>
                    {selectedRequest.status === 'pending' && (
                      <>
                        <TouchableOpacity 
                          style={styles.acceptButton}
                          onPress={() => handleUpdateStatus(selectedRequest.id, 'accepted')}
                        >
                          <Text style={styles.buttonText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.rescheduleButton}
                          onPress={() => {
                            setNewAppointmentTime(selectedRequest?.appointment_time || '');
                            setRescheduleModalVisible(true);
                          }}
                        >
                          <Text style={styles.buttonText}>Reschedule</Text>
                      </TouchableOpacity>
                      </>
                    )}
                    
                    {selectedRequest.status === 'accepted' && (
                      <TouchableOpacity 
                        style={styles.completeButton}
                        onPress={() => handleUpdateStatus(selectedRequest.id, 'completed')}
                      >
                        <Text style={styles.buttonText}>Mark Completed</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setRequestModalVisible(false)}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
          </Modal>
            <Modal
            animationType="slide"
            transparent={true}
            visible={rescheduleModalVisible}
            onRequestClose={() => setRescheduleModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Reschedule Appointment</Text>
                
                {/* Show current time for reference */}
                <View style={styles.currentTimeContainer}>
                  <Text style={styles.currentTimeLabel}>Current Time:</Text>
                  <Text style={styles.currentTimeText}>{selectedRequest?.appointment_time}</Text>
                </View>
                
                <Text style={styles.inputLabel}>New Date and Time:</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="e.g., May 20, 2023 10:00 AM"
                  value={newAppointmentTime}
                  onChangeText={setNewAppointmentTime}
                  autoFocus={true}
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={() => {
                      if (!newAppointmentTime.trim()) {
                        Alert.alert('Error', 'Please enter a valid time');
                        return;
                      }
                      if (selectedRequest?.id) {
                        handleReschedule(selectedRequest.id, newAppointmentTime);
                      } else {
                        Alert.alert('Error', 'No appointment selected');
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>Confirm Reschedule</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => {
                      setNewAppointmentTime('');
                      setRescheduleModalVisible(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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
      <Settings 
        isVisible={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
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
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderColor: '#2dd4bf',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0000FF',
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
    backgroundColor: '#ADD8E6',
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
    color: '#0000FF',
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
    color: '#0000FF',
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
    backgroundColor: '#E6F2FF',
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
    color: '#0000FF',
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
  },
  connectionCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F2FF',
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
    color: '#0000FF',
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
    color: '#0000FF',
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
    backgroundColor: '#1e3a8a',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0000FF',
  },
  userTypeBadge: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  captionInput: {
    minHeight: 120,
    padding: 16,
    backgroundColor: '#E6F2FF',
    borderRadius: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#0000FF',
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
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
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
  userTextContainer: {
    marginLeft: 12,
    flexDirection: 'column',
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0000FF',
    marginBottom: 2,
  },
  appointmentsContainer: {
    padding: 16,
    backgroundColor: ' #ADD8E6',
   
  },
  appointmentCard: {
    backgroundColor: '#ADD8E6',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  appointmentDate: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e3a8a',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewDetailsButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewDetailsText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
  },
  detailSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    width: 100,
  },
  detailValue: {
    fontSize: 15,
    color: '#1e293b',
    flex: 1,
  },
  reasonSection: {
    marginBottom: 16,
  },
  reasonText: {
    fontSize: 15,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    marginRight: 10,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  pendingStatus: {
    backgroundColor: '#fef9c3', // Light yellow
  },
  acceptedStatus: {
    backgroundColor: '#d1fae5', // Light green
  },
  rescheduleStatus: {
    backgroundColor: '#fee2e2', // Light red
  },
  completedStatus: {
    backgroundColor: '#e0f2fe', // Light blue
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  chatButton: {
    marginRight: 10,
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e3a8a',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  acceptButton: {
    backgroundColor: '#10b981', // Green
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    margin: 5,
  },
  rescheduleButton: {
    backgroundColor: '#ef4444', // Red
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    margin: 5,
  },
  completeButton: {
    backgroundColor: '#3b82f6', // Blue
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    margin: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    margin: 5,
  },
  currentTimeContainer: {
    marginBottom: 15,
  },
  currentTimeLabel: {
    fontSize: 14,
    color: '#666',
  },
  currentTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButtonText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },

});

export default DoctorFeed;