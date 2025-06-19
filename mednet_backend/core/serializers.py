from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Patient, Doctor, EmailVerificationCode
from django.contrib.auth.hashers import check_password
from .models import Post,PostLike
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Appointment,AppointmentRequest
from .models import AppointmentSummary
from .models import Chat, Message
from .models import Notification,MedicalCondition

class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = '__all__'
    
    def get_sender_name(self, obj):
        if obj.sender:
            return obj.sender.full_name
        return None




class AppointmentSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentSummary
        fields = ['id', 'patient', 'doctor_name', 'specialization', 'booking_for', 'full_name', 'age','gender', 'reason_of_visit','booked_date','completed_status', 'created_at']


class AppointmentSerializer(serializers.ModelSerializer):
    doctor = serializers.PrimaryKeyRelatedField(queryset=Doctor.objects.all())
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all())
    
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('status', 'created_at')


class PatientSerializer(serializers.ModelSerializer):
    # password field (write-only, used for hashing)
    password = serializers.CharField(write_only=True)
    disease = serializers.CharField(write_only=True, required=False)
    profile_pic = serializers.ImageField( required=False)
    class Meta:
        model = Patient
        fields = [
            'id','full_name', 'email', 'phone', 'date_of_birth',
            'age', 'gender', 'address', 'profile_pic',
            'password', 'disease'
        ]
        

    def create(self, validated_data):
       
        raw_password = validated_data.pop('password')
        validated_data['password_hash'] = make_password(raw_password)
        
        disease = validated_data.pop('disease', None)

       
        profile_pic = validated_data.pop('profile_pic', None)

        patient = Patient.objects.create(**validated_data)
        patient._disease = disease

       
        if profile_pic:
            patient.profile_pic = profile_pic
            patient.save()

        return patient

class EmailVerificationCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailVerificationCode
        fields = ['email', 'code']

#Doctor

class DoctorSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    profile_picture = serializers.ImageField( required=False)
    class Meta:
        model = Doctor
        fields = [
            'id','full_name', 'email', 'phone', 'date_of_birth',
            'license_number', 'specialization', 'qualification',
            'experience', 'current_workplace', 'address',
            'available_online', 'available_physical',
            'online_appointment_fee', 'physical_appointment_fee',
            'fee_type', 'working_hours', 'working_days_of_week',
            'available_on_weekends', 'weekend_days',
            'additional_info', 'profile_picture', 'password'
        ]

    def create(self, validated_data):
        raw_password = validated_data.pop('password')
        validated_data['password_hash'] = make_password(raw_password)
        profile_picture = validated_data.pop('profile_picture', None)

        doctor = Doctor.objects.create(**validated_data)

        if profile_picture:
            doctor.profile_picture = profile_picture
            doctor.save()

        return doctor


class DoctorsSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField()
    class Meta:
        model = Doctor
        fields = ['id', 'full_name', 'specialization', 'profile_picture']

class DoctorDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = [
            'id', 'full_name', 'specialization', 'profile_picture',
            'experience', 'additional_info', 'online_appointment_fee',
            'physical_appointment_fee', 'working_hours', 'working_days_of_week',
            'available_online', 'available_physical', 'qualification',
            'current_workplace', 'address'
        ]

class PatientDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            'full_name', 'email', 'phone', 'date_of_birth',
            'age', 'gender', 'address', 'profile_pic',
            'password_hash'
        ]

class PostSerializer(serializers.ModelSerializer):
    likes_count = serializers.SerializerMethodField()
    has_liked = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    user_type = serializers.SerializerMethodField()
    user_profile_pic = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'caption', 'image', 'created_at', 'user_name', 
                'user_type', 'user_profile_pic', 'likes_count', 'has_liked']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_has_liked(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user_id') and request.user_type:
            content_type = ContentType.objects.get_for_model(
                Patient if request.user_type == 'patient' else Doctor
            )
            return obj.likes.filter(
                user_content_type=content_type,
                user_object_id=request.user_id
            ).exists()
        return False

    def get_user_name(self, obj):
        return obj.user.full_name if obj.user else None

    def get_user_type(self, obj):
        if not obj.user:
            return None
        return 'patient' if isinstance(obj.user, Patient) else 'doctor'

    def get_user_profile_pic(self, obj):
        if not obj.user:
            return None
            
        try:
            if isinstance(obj.user, Patient):
                if obj.user.profile_pic:
                    return obj.user.profile_pic.url
            else:  # Doctor
                if obj.user.profile_picture:
                    return obj.user.profile_picture.url
        except Exception:
            return None
            
        return None
        
class PostLikeSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_profile_pic = serializers.SerializerMethodField()

    class Meta:
        model = PostLike
        fields = ['id', 'post', 'user_object_id', 'created_at', 'user_name', 'user_profile_pic']
        read_only_fields = ['created_at']

    def get_user_name(self, obj):
        if obj.user:
            if hasattr(obj.user, 'full_name'):
                return obj.user.full_name
            elif hasattr(obj.user, 'get_full_name'):
                return obj.user.get_full_name()
        return None

    def get_user_profile_pic(self, obj):
        if obj.user:
            if hasattr(obj.user, 'profile_pic'):
                return obj.user.profile_pic.url if obj.user.profile_pic else None
            elif hasattr(obj.user, 'profile_picture'):
                return obj.user.profile_picture.url if obj.user.profile_picture else None
        return None


class AppointmentRequestSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_details = DoctorSerializer(source='doctor', read_only=True)
    
    class Meta:
        model = AppointmentRequest
        fields = '__all__'

    def validate_doctor(self, value):
        if not Doctor.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Invalid doctor ID")
        return value

    def validate_patient(self, value):
        if not Patient.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Invalid patient ID")
        return value


class ChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chat
        fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'



class ChatsSerializers(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name')
    patient_id = serializers.IntegerField(source='patient.id')
    patient_profile_pic = serializers.ImageField(source='patient.profile_pic', read_only=True)

    class Meta:
        model = Chat
        fields = ['id', 'patient_name', 'patient_id', 'patient_profile_pic']


class DoctorChatSerializers(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name')
    doctor_id = serializers.IntegerField(source='doctor.id')
    doctor_profile_picture = serializers.ImageField(source='doctor.profile_picture', read_only=True)

    class Meta:
        model = Chat
        fields = ['id', 'doctor_name', 'doctor_id', 'doctor_profile_picture']



class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = [
            'full_name', 'email', 'phone', 'date_of_birth', 'license_number',
            'specialization', 'qualification', 'experience', 'current_workplace',
            'address', 'available_online', 'available_physical', 'online_appointment_fee',
            'physical_appointment_fee', 'fee_type', 'working_hours', 'working_days_of_week',
            'available_on_weekends', 'weekend_days', 'additional_info', 'profile_picture'
        ]
        extra_kwargs = {
            'license_number': {'read_only': True},  
        }

    def update(self, instance, validated_data):
        
        password = self.context.get('request').data.get('password')
        if password:
            instance.password_hash = make_password(password)
        
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            'full_name', 'email', 'phone', 'date_of_birth', 'age',
            'gender', 'address', 'profile_pic', 'medical_conditions'
        ]
        extra_kwargs = {
            'email': {'read_only': True},  
        }

    def update(self, instance, validated_data):
        
        password = self.context.get('request').data.get('password')
        if password:
            instance.password_hash = make_password(password)
        
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class RequestPasswordResetSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)  
    user_type = serializers.ChoiceField(choices=[('doctor', 'Doctor'), ('patient', 'Patient')])

class VerifyResetCodeSerializer(serializers.Serializer):
    user_type = serializers.ChoiceField(choices=[('doctor', 'Doctor'), ('patient', 'Patient')])
    user_id = serializers.IntegerField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=6)