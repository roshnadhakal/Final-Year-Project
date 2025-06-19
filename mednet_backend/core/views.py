from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import RetrieveAPIView,ListAPIView
from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view
from rest_framework import status
from django.utils import timezone
from .models import Patient,Doctor, Post, EmailVerificationCode, MedicalCondition, PatientCondition
from .serializers import PatientSerializer, DoctorSerializer,DoctorsSerializer,DoctorChatSerializers
import random
from django.contrib.auth import get_user_model 
from rest_framework import generics
from .serializers import PostSerializer,ChatsSerializers
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.http import HttpResponse
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.hashers import check_password
from .serializers import DoctorDetailSerializer,PatientDetailSerializer
from .models import Appointment,PostLike
from .serializers import AppointmentSerializer
from .models import AppointmentSummary
from .serializers import PostSerializer, PostLikeSerializer
from django.contrib.contenttypes.models import ContentType
from .serializers import AppointmentSummarySerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AppointmentRequest,Chat,Message
from .serializers import AppointmentRequestSerializer
from .serializers import ChatSerializer, MessageSerializer
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import AccessToken
from django.http import JsonResponse
import spacy
import numpy as np
from django.contrib.auth.hashers import make_password
from sklearn.metrics.pairwise import cosine_similarity
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from .models import Notification,PasswordResetCode
from .serializers import NotificationSerializer,DoctorProfileSerializer,PatientProfileSerializer
from .serializers import RequestPasswordResetSerializer, VerifyResetCodeSerializer
import logging

logger = logging.getLogger(__name__)

# Load SpaCy model
nlp = spacy.load('en_core_web_md')

@require_GET
def get_recommended_doctors(request, patient_id):
    """
    Returns a list of doctors recommended for a patient based on their medical conditions.
    Handles multiple medical conditions separated by commas and matches them with doctor specializations.
    """
    try:
        
        patient = Patient.objects.get(id=patient_id)

        patient_conditions = PatientCondition.objects.filter(patient=patient)
        
        if not patient_conditions.exists():
            doctors = Doctor.objects.all()
            return JsonResponse([{
                'id': doctor.id,
                'full_name': doctor.full_name,
                'specialization': doctor.specialization,
                'profile_picture': doctor.profile_picture.url if doctor.profile_picture else None,
                'qualification': doctor.qualification,
                'experience': doctor.experience,
                'similarity_score': 0
            } for doctor in doctors], safe=False)
        
        # Extract individual medical conditions
        all_conditions = []
        for patient_condition in patient_conditions:
            condition_name = patient_condition.condition.name
            
            # Split by comma to get individual conditions
            individual_conditions = [c.strip() for c in condition_name.split(',')]
            all_conditions.extend(individual_conditions)
        
        # Remove duplicates and convert to lowercase
        unique_conditions = list(set([condition.lower() for condition in all_conditions]))
        
        # Process each condition with SpaCy
        condition_docs = [nlp(condition) for condition in unique_conditions]
        
        doctors = Doctor.objects.all()
        recommended_doctors = []
        
        for doctor in doctors:
            # Process doctor's specialization with SpaCy
            specialization = doctor.specialization.lower()
            doctor_doc = nlp(specialization)
            
            # Calculate maximum similarity between any patient condition and doctor specialization
            max_similarity = 0
            matched_condition = None
            
            for idx, condition_doc in enumerate(condition_docs):
                if condition_doc.vector_norm and doctor_doc.vector_norm:
                    similarity = condition_doc.similarity(doctor_doc)
                    if similarity > max_similarity:
                        max_similarity = similarity
                        matched_condition = unique_conditions[idx]
            
            # Check for direct keyword matches (prioritize these)
            direct_match_found = False
            for condition in unique_conditions:
                # Check if condition is directly in specialization or vice versa
                if (condition in specialization or 
                    any(spec_word in condition for spec_word in specialization.split())):
                    direct_match_found = True
                    matched_condition = condition
                    break
            
            # Boost score if direct match found
            if direct_match_found:
                max_similarity = max(max_similarity, 0.8)  # Ensure high score for direct matches
            
            if max_similarity > 0.3:  
                recommended_doctors.append({
                    'id': doctor.id,
                    'full_name': doctor.full_name,
                    'specialization': doctor.specialization,
                    'profile_picture': doctor.profile_picture.url if doctor.profile_picture else None,
                    'qualification': doctor.qualification,
                    'experience': doctor.experience,
                    'similarity_score': float(max_similarity),
                    'matched_condition': matched_condition
                })
        
       
        recommended_doctors.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        
        return JsonResponse(recommended_doctors[:10], safe=False)
    
    except Patient.DoesNotExist:
        return JsonResponse({'error': 'Patient not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


        

class AppointmentSummaryCreateView(generics.CreateAPIView):
    queryset = AppointmentSummary.objects.all()
    serializer_class = AppointmentSummarySerializer

@api_view(['GET'])
def get_patient_appointments(request):
    patient_id = request.query_params.get('patient_id')
    appointments = AppointmentSummary.objects.filter(patient_id=patient_id)
    serializer = AppointmentSummarySerializer(appointments, many=True)
    return Response(serializer.data)

@api_view(['GET','PATCH'])
def update_appointment_status(request, id):
    try:
        appointment = AppointmentSummary.objects.get(id=id)
        appointment.completed_status = "Appointment Completed"
        appointment.save()
        return Response({'status': 'success', 'message': 'Appointment marked as completed'})
    except AppointmentSummary.DoesNotExist:
        return Response({'status': 'error', 'message': 'Appointment not found'}, status=404)

class AppointmentCreateView(APIView):
    
    def post(self, request):
        
        try:
            patient = Patient.objects.get(email=request.user.email)
        except Patient.DoesNotExist:
            return Response(
                {"error": "Patient not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        
        request.data['patient'] = patient.id
        
        serializer = AppointmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientSignUpView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)
   
    def post(self, request,*args, **kwargs):
        try:
            serializer = PatientSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

            patient = serializer.save()

            # Handle the disease as a MedicalCondition (if passed)
            disease = getattr(patient, '_disease', None)
            if disease:
                condition, _ = MedicalCondition.objects.get_or_create(name=disease)
                PatientCondition.objects.create(
                    patient=patient,
                    condition=condition,
                    severity='Unknown',
                    diagnosis_date=timezone.now()
                )

            # Generate verification code
            verification_code = self._generate_verification_code(patient.email)
            self._send_verification_email(patient.email, verification_code)

            return Response({
                'message': 'Patient registered successfully. Verification code sent to email.',
                'email': patient.email,
                'status': 'pending_verification'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _handle_medical_condition(self, disease, patient):
        if disease:
            condition, _ = MedicalCondition.objects.get_or_create(name=disease)
            PatientCondition.objects.create(
                patient=patient,
                condition=condition,
                severity='Unknown',
                diagnosis_date=timezone.now()
            )

    def _generate_verification_code(self, email):
        code = str(random.randint(100000, 999999))
        EmailVerificationCode.objects.filter(email=email).delete()
        EmailVerificationCode.objects.create(email=email, code=code)
        return code

    def _send_verification_email(self, email, code):
        subject = 'Your Email Verification Code'
        message = f'Your verification code is: {code}'
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [email]

        send_mail(subject, message, from_email, recipient_list)
    
    

class VerifyCodeView(APIView):
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response({'message': 'Email and code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            verification_entry = EmailVerificationCode.objects.filter(email=email, code=code).first()

            if not verification_entry:
                return Response({'message': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

            if verification_entry.is_expired():
                return Response({'message': 'Verification code has expired.'}, status=status.HTTP_400_BAD_REQUEST)

            verification_entry.is_verified = True
            verification_entry.save()

            patient = Patient.objects.filter(email=email).order_by('-id').first()
            if patient:
                patient.email_verified = True
                patient.save()

            return Response({'status': 'verified', 'message': 'Email verified successfully.'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResendVerificationCodeView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'message': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Remove old codes
            EmailVerificationCode.objects.filter(email=email).delete()

            # Create new code
            code = str(random.randint(100000, 999999))
            EmailVerificationCode.objects.create(email=email, code=code)

            # Send email
            subject = 'Your New Verification Code'
            message = f'Your new verification code is: {code}'
            from_email = settings.DEFAULT_FROM_EMAIL
            send_mail(subject, message, from_email, [email])

            return Response({'message': 'New verification code sent.'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DoctorSignUpView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        serializer = DoctorSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        doctor = serializer.save()

        # Generate and send verification code
        code = self._generate_verification_code(doctor.email)
        self._send_verification_email(doctor.email, code)

        return Response({
            'message': 'Doctor registered successfully. Verification code sent to email.',
            'email': doctor.email,
            'status': 'pending_verification'
        }, status=status.HTTP_201_CREATED)

    def _generate_verification_code(self, email):
        code = str(random.randint(100000, 999999))
        EmailVerificationCode.objects.filter(email=email).delete()
        EmailVerificationCode.objects.create(email=email, code=code, user_type='doctor')
        return code

    def _send_verification_email(self, email, code):
        subject = 'Doctor Email Verification Code'
        message = f'Your verification code is: {code}'
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [email]
        send_mail(subject, message, from_email, recipient_list)

class DoctorVerifyView(APIView):
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response({'error': 'Email and code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            verification = EmailVerificationCode.objects.filter(email=email, code=code).first()
            if not verification:
                return Response({'message': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

            if verification.is_expired():
                return Response({'message': 'Verification code has expired.'}, status=status.HTTP_400_BAD_REQUEST)

            verification.is_verified = True
            verification.save()

            doctor = Doctor.objects.filter(email=email).order_by('-id').first()
            doctor.email_verified = True
            doctor.save()

            return Response({'status': 'verified', 'message': 'Email verified successfully.'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DoctorResendCodeView(APIView):
    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Remove old codes
            EmailVerificationCode.objects.filter(email=email).delete()

            # Create new code
            code = str(random.randint(100000, 999999))
            EmailVerificationCode.objects.create(email=email, code=code)

            # Send email
            subject = 'Your New Verification Code'
            message = f'Your new verification code is: {code}'
            from_email = settings.DEFAULT_FROM_EMAIL
            send_mail(subject, message, from_email, [email])

            return Response({'message': 'Verification code resent successfully.'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    def post(self, request):
        email_or_phone = request.data.get('email_or_phone', '').lower()
        password = request.data.get('password', '')

        user = None
        user_type = None

        # Check for patients
        patient_candidates = Patient.objects.filter(email=email_or_phone) | Patient.objects.filter(phone=email_or_phone)
        for patient in patient_candidates:
            if check_password(password, patient.password_hash):
                if not patient.email_verified:
                    return Response({'status': 'error', 'message': 'Please verify your email before logging in.'}, status=status.HTTP_403_FORBIDDEN)
                user = patient
                user_type = 'patient'
                break

        # Check for doctors if no matching patient found
        if not user:
            doctor_candidates = Doctor.objects.filter(email=email_or_phone) | Doctor.objects.filter(phone=email_or_phone)
            for doctor in doctor_candidates:
                if check_password(password, doctor.password_hash):
                    if not doctor.email_verified:
                        return Response({'status': 'error', 'message': 'Please verify your email before logging in.'}, status=status.HTTP_403_FORBIDDEN)
                    user = doctor
                    user_type = 'doctor'
                    break

        if not user:
            return Response({'status': 'error', 'message': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        user_data = {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
        }

        return Response({'status': 'success', 'user_type': user_type, 'user': user_data}, status=status.HTTP_200_OK)

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorsSerializer
    lookup_field = 'id'


class DoctorDetailView(RetrieveAPIView):
    queryset = Doctor.objects.all()
    serializer_class = DoctorDetailSerializer
    lookup_field = 'id'

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    lookup_field = 'id'


class PatientDetailView(RetrieveAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientDetailSerializer
    lookup_field = 'id'


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        user_id = self.request.data.get('user_id')
        user_type = self.request.data.get('user_type')
        
        if not user_id or not user_type:
            raise serializers.ValidationError({'error': 'user_id and user_type are required'})
        
        if user_type == 'patient':
            model = Patient
        elif user_type == 'doctor':
            model = Doctor
        else:
            raise serializers.ValidationError({'error': 'Invalid user_type'})
        
        try:
            user = model.objects.get(id=user_id)
        except model.DoesNotExist:
            raise serializers.ValidationError({'error': f'{user_type} not found'})
        
        content_type = ContentType.objects.get_for_model(model)
        serializer.save(
            user_content_type=content_type,
            user_object_id=user.id
        )

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        user_id = request.data.get('user_id')
        user_type = request.data.get('user_type')
        
        if not user_id or not user_type:
            return Response({'error': 'user_id and user_type are required'}, status=400)
        
        if user_type == 'patient':
            model = Patient
        elif user_type == 'doctor':
            model = Doctor
        else:
            return Response({'error': 'Invalid user_type'}, status=400)
        
        try:
            user = model.objects.get(id=user_id)
        except model.DoesNotExist:
            return Response({'error': f'{user_type} not found'}, status=404)
        
        content_type = ContentType.objects.get_for_model(model)
        like, created = PostLike.objects.get_or_create(
            post=post,
            user_content_type=content_type,
            user_object_id=user.id
        )
        
        if not created:
            like.delete()
            return Response({
                'status': 'unliked',
                'likes_count': post.likes.count(),
                'has_liked': False
            })
        
        return Response({
            'status': 'liked',
            'likes_count': post.likes.count(),
            'has_liked': True
        })

class PostListCreateView(generics.ListCreateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class PostLikeView(APIView):
    def post(self, request, post_id):
        user_id = request.data.get('user_id')
        user_type = request.data.get('user_type')
        
        if not user_id or not user_type:
            return Response({'error': 'User information missing'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if user_type == 'patient':
            content_type = ContentType.objects.get_for_model(Patient)
        else:
            content_type = ContentType.objects.get_for_model(Doctor)
            
        like, created = PostLike.objects.get_or_create(
            post=post,
            user_content_type=content_type,
            user_object_id=user_id
        )
        
        if not created:
            like.delete()
            return Response({
                'status': 'unliked',
                'likes_count': post.likes.count(),
                'has_liked': False
            }, status=status.HTTP_200_OK)
            
        return Response({
            'status': 'liked',
            'likes_count': post.likes.count(),
            'has_liked': True
        }, status=status.HTTP_201_CREATED)


class AppointmentRequestViewSet(viewsets.ModelViewSet):
    queryset = AppointmentRequest.objects.all()
    serializer_class = AppointmentRequestSerializer

    def create(self, request, *args, **kwargs):
        # Add doctor/patient existence checks
        doctor_id = request.data.get('doctor')
        patient_id = request.data.get('patient')
        
        if not Doctor.objects.filter(id=doctor_id).exists():
            return Response({"doctor": "Invalid doctor ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not Patient.objects.filter(id=patient_id).exists():
            return Response({"patient": "Invalid patient ID"}, status=status.HTTP_400_BAD_REQUEST)
        
        modified_data = request.data.copy()
        modified_data['doctor'] = doctor_id
        modified_data['patient'] = patient_id
        serializer = self.get_serializer(data=modified_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        # return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def doctor_requests(self, request):
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id:
            return Response({"error": "Doctor ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        requests = AppointmentRequest.objects.filter(doctor_id=doctor_id)
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        appointment = self.get_object()
        status_value = request.data.get('status')
        
        if status_value not in [choice[0] for choice in AppointmentRequest.STATUS_CHOICES]:
            return Response({"error": "Invalid status value"}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = appointment.status
        appointment.status = status_value
        appointment.save()

        # Create notification for the patient
        if old_status != status_value:
            try:
                
                status_messages = {
                    'accepted': f"Dr. {appointment.doctor.full_name} has accepted your appointment",
                    'rescheduled': f"Dr. {appointment.doctor.full_name} has rescheduled your appointment",
                    'completed': f"Dr. {appointment.doctor.full_name} has marked your appointment as completed"
                }
                
                message = status_messages.get(status_value, f"Your appointment status was updated to {status_value}")
                
                notification = Notification.objects.create(
                    recipient=appointment.patient,  
                    sender=appointment.doctor,      
                    recipient_type='patient',
                    message=message,
                    appointment_request=appointment
                )
                # Log successful notification creation
                print(f"Notification created successfully: {notification.id}")
            except Exception as e:
                print(f"Error creating notification: {str(e)}")
                import traceback
                traceback.print_exc()
     
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)



    @action(detail=True, methods=['patch'])
    def mark_as_seen(self, request, pk=None):
        appointment = self.get_object()
        appointment.seen_by_doctor = True
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def reschedule(self, request, pk=None):
        appointment = self.get_object()
        rescheduled_time = request.data.get('rescheduled_time')
        
        if not rescheduled_time:
            return Response({"error": "rescheduled_time is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        appointment.rescheduled_time = rescheduled_time
        appointment.status = 'rescheduled'  # Also update the status to 'rescheduled'
        appointment.save()

        try:
            
            notification = Notification.objects.create(
                recipient=appointment.patient,
                sender=appointment.doctor,
                recipient_type='patient',
                message=f"Dr. {appointment.doctor.full_name} has rescheduled your appointment to {rescheduled_time}",
                appointment_request=appointment
            )
            print(f"Reschedule notification created successfully: {notification.id}")
        except Exception as e:
            print(f"Error creating reschedule notification: {str(e)}")
            import traceback
            traceback.print_exc()

        serializer = self.get_serializer(appointment)
        return Response(serializer.data)


        

class GetOrCreateChatView(generics.GenericAPIView):
    serializer_class = ChatSerializer

    def post(self, request):
        patient_id = request.data.get('patient_id')
        doctor_id = request.data.get('doctor_id')

        if not patient_id or not doctor_id:
            return Response({'error': 'Missing patient_id or doctor_id'}, status=400)

        chat, created = Chat.objects.get_or_create(patient_id=patient_id, doctor_id=doctor_id)
        serializer = self.get_serializer(chat)
        return Response(serializer.data)

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer

    def get_queryset(self):
        chat_id = self.kwargs['chat_id']
        return Message.objects.filter(chat_id=chat_id)

    def perform_create(self, serializer):
        serializer.save()

@api_view(['GET'])
def doctor_chat_list(request, doctor_id):
    chats = Chat.objects.filter(doctor__id=doctor_id).select_related('patient')
    serializer = ChatsSerializers(chats, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def patient_chat_list(request, patient_id):
    chats = Chat.objects.filter(patient__id=patient_id).select_related('doctor')
    serializer = DoctorChatSerializers(chats, many=True)
    return Response(serializer.data)





class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    
    def get_queryset(self):
       
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy', 'mark_as_read']:
            return Notification.objects.all()
            
        user_id = self.request.query_params.get('user_id')
        user_type = self.request.query_params.get('user_type')
        
        if not user_id or not user_type:
            return Notification.objects.none()
            
        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return Notification.objects.none()
        
        return Notification.objects.filter(
            recipient_id=user_id,
            recipient_type=user_type
        ).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        user_id = request.query_params.get('user_id')
        user_type = request.query_params.get('user_type')
        
        if not user_id or not user_type:
            return Response({'count': 0})
            
        try:
            if user_type == 'doctor':
                doctor = Doctor.objects.get(id=user_id)
                recipient_id = doctor.id
            elif user_type == 'patient':
                patient = Patient.objects.get(id=user_id)
                recipient_id = patient.id
            else:
                return Response({'count': 0})
                
            count = Notification.objects.filter(
                recipient_id=recipient_id, 
                recipient_type=user_type,
                is_read=False
            ).count()
            return Response({'count': count})
        except (Doctor.DoesNotExist, Patient.DoesNotExist):
            return Response({'count': 0})
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        user_id = request.data.get('user_id')
        user_type = request.data.get('user_type')
        
        if not user_id or not user_type:
            return Response({"error": "User ID and type are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            notification = self.get_object()
            
            if str(notification.recipient_id) != str(user_id) or notification.recipient_type != user_type:
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
                
            notification.is_read = True
            notification.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        user_id = request.data.get('user_id')
        user_type = request.data.get('user_type')
        
        if not user_id or not user_type:
            return Response({"error": "User ID and type are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            if user_type == 'doctor':
                Doctor.objects.get(id=user_id)
            elif user_type == 'patient':
                Patient.objects.get(id=user_id)
            else:
                return Response({"error": "Invalid user type"}, status=status.HTTP_400_BAD_REQUEST)
                
            Notification.objects.filter(
                recipient_id=user_id,
                recipient_type=user_type,
                is_read=False
            ).update(is_read=True)
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except (Doctor.DoesNotExist, Patient.DoesNotExist):
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)



class DoctorProfileView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request, doctor_id): 
        doctor = get_object_or_404(Doctor, id=doctor_id)
        serializer = DoctorProfileSerializer(doctor)
        return Response(serializer.data)
    
    def patch(self, request, doctor_id):  
        doctor = get_object_or_404(Doctor, id=doctor_id)
        serializer = DoctorProfileSerializer(
            doctor, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PatientProfileView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request, patient_id):  
        patient = get_object_or_404(Patient, id=patient_id)
        serializer = PatientProfileSerializer(patient)
        return Response(serializer.data)
    
    def patch(self, request, patient_id):  
        patient = get_object_or_404(Patient, id=patient_id)
        serializer = PatientProfileSerializer(
            patient, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def request_password_reset(request):
    serializer = RequestPasswordResetSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    phone = serializer.validated_data['phone']
    user_type = serializer.validated_data['user_type']

    Model = Doctor if user_type == 'doctor' else Patient
    try:
        user = Model.objects.get(phone=phone)
    except Model.DoesNotExist:
        logger.error(f"Password reset attempt for non-existent {user_type}: {phone}")
        return Response({'error': 'User not found with this phone number'}, status=404)

    code = str(random.randint(100000, 999999))
    PasswordResetCode.objects.filter(user_type=user_type, user_id=user.id).delete()
    PasswordResetCode.objects.create(user_type=user_type, user_id=user.id, code=code)

    # Enhanced logging
    logger.info("\n" + "="*50)
    logger.info("PASSWORD RESET REQUEST")
    logger.info(f"User Type: {user_type}")
    logger.info(f"User ID: {user.id}")
    logger.info(f"Full Name: {user.full_name}")
    logger.info(f"Phone: {phone}")
    logger.info(f"Reset Code: {code}")
    logger.info("="*50 + "\n")

    return Response({
        'message': 'Verification code generated (check server console)',
        'user_id': user.id
    })

@api_view(['POST'])
def verify_reset_code(request):
    try:
        serializer = VerifyResetCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        user_type = data['user_type']
        user_id = data['user_id']
        code = data['code']
        new_password = data['new_password']

        code_obj = PasswordResetCode.objects.filter(
            user_type=user_type,
            user_id=user_id,
            code=code
        ).first()

        if not code_obj:
            return Response({'error': 'Invalid verification code'}, status=400)
        
        if code_obj.is_expired():
            code_obj.delete()
            return Response({'error': 'Verification code has expired'}, status=400)

        Model = Doctor if user_type == 'doctor' else Patient
        try:
            user = Model.objects.get(id=user_id)
        except Model.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters'}, status=400)

        user.password_hash = make_password(new_password)
        user.save()

        code_obj.delete()

        return Response({'message': 'Password reset successfully'})

    except Exception as e:
        logger.error(f"Error in verify_reset_code: {str(e)}")
        return Response({'error': 'An error occurred'}, status=500)