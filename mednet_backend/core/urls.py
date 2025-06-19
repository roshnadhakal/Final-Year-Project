from django.urls import path
from .views import PatientSignUpView, VerifyCodeView,ResendVerificationCodeView,update_appointment_status
from .views import DoctorVerifyView, DoctorResendCodeView,DoctorSignUpView,LoginView
from .views import DoctorViewSet,PatientViewSet,get_patient_appointments
from django.http import HttpResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import doctor_chat_list,patient_chat_list
from rest_framework.routers import DefaultRouter
from .views import AppointmentCreateView,PostListCreateView, PostLikeView
from .views import AppointmentSummaryCreateView,GetOrCreateChatView, MessageListCreateView
from .views import AppointmentRequestViewSet, update_appointment_status
from .views import get_recommended_doctors,verify_reset_code
from .views import DoctorDetailView,PatientDetailView,request_password_reset
from .views import NotificationViewSet,DoctorProfileView, PatientProfileView

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'appointment-requests', AppointmentRequestViewSet, basename='appointmentrequest')
router.register(r'doctors', DoctorViewSet)
router.register(r'patients', PatientViewSet)

urlpatterns = [
    path('', lambda request: HttpResponse("Welcome to MedNet API 🚑")),
    path('signup/', PatientSignUpView.as_view()),
    path('verify/', VerifyCodeView.as_view()),
    path('resend-code/', ResendVerificationCodeView.as_view(), name='resend-code'),
    path('doctor/signup/', DoctorSignUpView.as_view(), name='doctor-signup'),
    path('doctor/verify/', DoctorVerifyView.as_view(), name='doctor-verify'),
    path('doctor/resend/', DoctorResendCodeView.as_view(), name='doctor-resend-code'),
    path('login/', LoginView.as_view(), name='login'),
    path('', include(router.urls)),
    path('appointment-summary/', AppointmentSummaryCreateView.as_view(), name='appointment-summary-create'),
    path('appointments/', get_patient_appointments, name='get-patient-appointments'),
    path('appointments/<int:id>/', update_appointment_status, name='update-appointment-status'),
    path('posts/', PostListCreateView.as_view(), name='post-list'),
    path('posts/<int:post_id>/like/', PostLikeView.as_view(), name='post-like'),
    path('chat/', GetOrCreateChatView.as_view(), name='get_or_create_chat'),
    path('chat/<int:chat_id>/messages/', MessageListCreateView.as_view(), name='chat_messages'),
    path('doctor/<int:doctor_id>/chats/', doctor_chat_list),
    path('patients/<int:patient_id>/chats/', patient_chat_list),
    path('recommendations/<int:patient_id>/', get_recommended_doctors, name='get_recommended_doctors'),
    path('doctors/<int:doctor_id>/', DoctorProfileView.as_view(), name='doctor-profile'),
    path('patients/<int:patient_id>/', PatientProfileView.as_view(), name='patient-profile'),
    path('doctors/view/<int:id>/', DoctorDetailView.as_view(), name='doctor-detail'),
    path('patients/view/<int:id>/', PatientDetailView.as_view(), name='patient-detail'),
    path('request-password-reset/', request_password_reset),
    path('verify-reset-code/', verify_reset_code),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


