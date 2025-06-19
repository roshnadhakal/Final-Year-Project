from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.conf import settings
import uuid
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


# ========== DOCTOR ==========

class Doctor(models.Model):
    # Basic Info
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doctor_profile',blank=True, null=True
    )
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    date_of_birth = models.DateField(null=True, blank=True)
    license_number = models.CharField(max_length=100, unique=True)
    specialization = models.CharField(max_length=255)
    password_hash = models.TextField()
    
    # Professional Details
    qualification = models.CharField(max_length=255)
    experience = models.PositiveIntegerField(help_text="Experience in years")
    current_workplace = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField()

    # Appointment Details
    available_online = models.BooleanField(default=False)
    available_physical = models.BooleanField(default=False)
    online_appointment_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    physical_appointment_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    FEE_TYPE_CHOICES = [
        ('Online', 'Online'),
        ('Physical', 'Physical'),
        ('Both', 'Both'),
    ]
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES, default='Both')
    working_hours = models.CharField(max_length=100,blank=True,null=True,help_text="e.g. 9 a.m to 5 p.m"
    )
    # Availability & Scheduling
    working_days_of_week = models.CharField(max_length=100, help_text="e.g. Monday,Tuesday,Wednesday")
    available_on_weekends = models.BooleanField(default=False)
    weekend_days = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="e.g. Saturday,Sunday"
    )

    # Extra Info
    additional_info = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='doctor_profiles/', blank=True, null=True)
    email_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)

    def __str__(self):
        return self.full_name


class MedicalCondition(models.Model):
    name = models.CharField(max_length=255)
    icd_code = models.CharField(max_length=50)

    def __str__(self):
        return self.name

def upload_to(instance, filename):
    return 'images/{filename}'.format(filename=filename)


class Patient(models.Model):
    
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
        ('Prefer not to say', 'Prefer not to say'),
    ]
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='patient_profile', blank=True, null=True
    )
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    date_of_birth = models.DateField()
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES)
    address = models.TextField()
    profile_pic = models.ImageField(upload_to = upload_to, blank=True, null=True)
    password_hash = models.TextField()
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Many-to-many with conditions
    medical_conditions = models.ManyToManyField(
        MedicalCondition,
        through='PatientCondition',
        related_name='patients'
    )

    def __str__(self):
        return self.full_name


class PatientCondition(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    condition = models.ForeignKey(MedicalCondition, on_delete=models.CASCADE)
    severity = models.CharField(max_length=50)
    diagnosis_date = models.DateField()

    def __str__(self):
        return f"{self.patient.full_name} - {self.condition.name}"


class EmailVerificationCode(models.Model):
    email = models.EmailField()
    user_type = models.CharField(max_length=10, null=True, blank=True,choices=[('patient', 'Patient'), ('doctor', 'Doctor')])
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def __str__(self):
        return f"{self.email} - {self.code}"





# models.py
class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='doctor_appointments')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='patient_appointments')
    appointment_date = models.TextField(null=True, blank=True)
    appointment_time = models.CharField(max_length=20)
    appointment_type = models.CharField(max_length=20, default='Physical')
    patient_name = models.CharField(max_length=100)
    patient_age = models.CharField(max_length=10)
    patient_gender = models.CharField(max_length=10)
    problem_description = models.TextField()
    payment_status = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Appointment for {self.patient_name} with Dr. {self.doctor.full_name}"


class AppointmentSummary(models.Model):
    APPOINTMENT_TYPES = [
        ('Physical', 'Physical'),
        ('Online', 'Online'),
    ]
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    doctor_name = models.CharField(max_length=100)
    specialization = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    booking_for = models.CharField(max_length=50,null=True, blank=True)
    full_name = models.CharField(max_length=100,null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=20,null=True, blank=True)
    reason_of_visit = models.TextField(null=True, blank=True)
    booked_date = models.TextField(null=True, blank=True)
    appointment_type = models.CharField(
        max_length=10, 
        choices=APPOINTMENT_TYPES, 
        default='Online',
        null=True, blank=True,
    )
    completed_status = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"{self.patient.full_name} - {self.doctor_name}"

# models.py
class Post(models.Model):
    user_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    user_object_id = models.PositiveIntegerField(null=True, blank=True)
    user = GenericForeignKey('user_content_type', 'user_object_id')
    caption = models.TextField()
    image = models.ImageField(upload_to='posts/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class PostLike(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    user_object_id = models.PositiveIntegerField(null=True, blank=True)
    user = GenericForeignKey('user_content_type', 'user_object_id')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
       unique_together = ('post', 'user_content_type', 'user_object_id')


User = get_user_model()

class AppointmentRequest(models.Model):
    APPOINTMENT_TYPES = [
        ('Physical', 'Physical'),
        ('Online', 'Online'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('rescheduled', 'Rescheduled'),
    ]

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='doctor_requests')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='patient_requests')
    doctor_name = models.CharField(max_length=255)
    specialization = models.CharField(max_length=255)
    booking_for = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255)
    age = models.CharField(max_length=20)
    gender = models.CharField(max_length=20)
    reason_of_visit = models.TextField()
    booked_on = models.TextField(null=True, blank=True)
    appointment_time = models.TextField(null=True, blank=True)
    appointment_type = models.CharField(
        max_length=10, 
        choices=APPOINTMENT_TYPES, 
        default='Online',
        null=True, blank=True,
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    seen_by_doctor = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    rescheduled_time = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Appointment request from {self.full_name} to Dr. {self.doctor_name}"

    def save(self, *args, **kwargs):
        print(f"Saving with rescheduled_time: {self.rescheduled_time}")  # Debug
        super().save(*args, **kwargs)



class Chat(models.Model):
    patient = models.ForeignKey('Patient', on_delete=models.CASCADE, related_name='patient_chats')
    doctor = models.ForeignKey('Doctor', on_delete=models.CASCADE, related_name='doctor_chats')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('patient', 'doctor')

    def __str__(self):
        return f"Chat between {self.patient.full_name} and {self.doctor.full_name}"

class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    sender_patient = models.ForeignKey('Patient', on_delete=models.SET_NULL, related_name='sent_messages', null=True, blank=True)
    sender_doctor = models.ForeignKey('Doctor', on_delete=models.SET_NULL, related_name='sent_messages', null=True, blank=True)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    sender_type = models.CharField(max_length=10, choices=[('patient', 'Patient'), ('doctor', 'Doctor')],null=True, blank=True)

    class Meta:
        ordering = ['timestamp']

    @property
    def sender(self):
        return self.sender_patient or self.sender_doctor

    def __str__(self):
        return f"Message from {self.sender.full_name} at {self.timestamp}"






class Notification(models.Model):
    recipient = models.ForeignKey(Patient, related_name='notifications', on_delete=models.CASCADE)
    sender = models.ForeignKey(Doctor, related_name='sent_notifications', on_delete=models.CASCADE, null=True, blank=True)
    recipient_type = models.CharField(max_length=10, choices=[('doctor', 'Doctor'), ('patient', 'Patient')], null=True)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    appointment_request = models.ForeignKey('AppointmentRequest', related_name='notifications', 
                                          on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Notification for {self.recipient.full_name if hasattr(self.recipient, 'full_name') else self.recipient}: {self.message}"


class PasswordResetCode(models.Model):
    user_type_choices = [
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
    ]
    user_type = models.CharField(max_length=10, choices=user_type_choices)
    user_id = models.IntegerField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)
        
    def __str__(self):
        return f"{self.user_type} - {self.user_id} - {self.code}"