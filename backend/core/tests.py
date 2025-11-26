from django.test import TestCase
from django.test import TestCase
from .models import StudentProfile
from django.contrib.auth.models import User

class StudentModelTest(TestCase):
    def test_student_creation(self):
        user = User.objects.create_user(username='test', password='test')
        student = StudentProfile.objects.create(user=user, student_id='12345', name='Test Student')
        self.assertEqual(student.name, 'Test Student')
# Create your tests here.
