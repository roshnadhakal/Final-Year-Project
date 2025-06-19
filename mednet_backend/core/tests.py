from django.test import TestCase, Client
from django.urls import reverse
from .models import Patient, Doctor, MedicalCondition, PatientCondition
from django.core.files.uploadedfile import SimpleUploadedFile
import tempfile
from datetime import date

class RecommendationTestCase(TestCase):
    def setUp(self):
        self.client = Client()

        # Create a dummy patient
        self.patient = Patient.objects.create(
            full_name="John Doe",
            email="john@example.com",
            phone="1234567890",
            date_of_birth=date(2000, 1, 1),
            age=24,
            gender="Male",
            address="123 Street",
            password_hash="hashedpassword",
        )

        # Create medical conditions
        self.condition1 = MedicalCondition.objects.create(name="Diabetes", icd_code="E11")
        self.condition2 = MedicalCondition.objects.create(name="Heart disease", icd_code="I51")

        # Link patient to conditions
        PatientCondition.objects.create(patient=self.patient, condition=self.condition1, severity="Moderate", diagnosis_date=date.today())
        PatientCondition.objects.create(patient=self.patient, condition=self.condition2, severity="High", diagnosis_date=date.today())

        # Create doctors
        self.doctor1 = Doctor.objects.create(
            full_name="Dr. Smith",
            email="smith@example.com",
            phone="9999999999",
            date_of_birth=date(1980, 1, 1),
            license_number="DOC123",
            specialization="Endocrinology",  
            qualification="MBBS, MD",
            experience=10,
            address="Clinic A",
            password_hash="hash1",
            working_days_of_week="Monday,Tuesday",
        )

        self.doctor2 = Doctor.objects.create(
            full_name="Dr. Jane",
            email="jane@example.com",
            phone="8888888888",
            date_of_birth=date(1975, 1, 1),
            license_number="DOC456",
            specialization="Cardiology",  
            qualification="MBBS, DM",
            experience=15,
            address="Clinic B",
            password_hash="hash2",
            working_days_of_week="Wednesday,Thursday",
        )

    def test_recommendations_exist(self):
        url = reverse('get_recommended_doctors', args=[self.patient.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(isinstance(data, list))
        self.assertTrue(len(data) > 0)

        # test that returned doctors contain similarity_score
        for doctor in data:
            self.assertIn('similarity_score', doctor)
            self.assertGreaterEqual(doctor['similarity_score'], 0.3)  # threshold

    def test_recommendations_patient_not_found(self):
        url = reverse('get_recommended_doctors', args=[999])  # Nonexistent patient
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)
        self.assertIn('error', response.json())