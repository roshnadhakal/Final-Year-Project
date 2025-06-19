// screens/Patient/ReviewDoctor.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import config from '../../src/config/config';
import { useAuth } from '../../context/AuthContext';

const ReviewDoctor = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const handleSubmitReview = async () => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/reviews/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctor_id: params.doctor_id,
          patient_id: user?.id,
          rating: rating,
          comment: reviewText,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit review');
      
      Alert.alert('Success', 'Thank you for your review!');
      router.back();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review');
    }
  };

  return (
    <ProtectedRoute requiredUserType="patient">
      <View style={styles.container}>
        <Text style={styles.title}>Leave a Review</Text>
        
        <TextInput
          style={styles.reviewInput}
          multiline
          placeholder="Write your review here..."
          value={reviewText}
          onChangeText={setReviewText}
        />
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmitReview}
        >
          <Text style={styles.submitButtonText}>Submit Review</Text>
        </TouchableOpacity>
      </View>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    minHeight: 150,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#1e3a8a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ReviewDoctor;