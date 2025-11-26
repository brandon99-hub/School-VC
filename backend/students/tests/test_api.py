# students/tests/test_api.py
from rest_framework.test import APITestCase
from .models import Student, Attendance
from django.contrib.auth.models import User

class AttendanceAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='test', password='test123')
        self.client.force_authenticate(self.user)
        self.student = Student.objects.create(user=self.user, student_id='S001', grade='10')

    def test_bulk_attendance_update(self):
        data = [
            {'student': self.student.id, 'date': '2025-03-25', 'status': 'Present'},
            {'student': self.student.id, 'date': '2025-03-26', 'status': 'Absent'},
        ]
        response = self.client.post('/api/students/bulk_attendance/', {'attendance': data}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Attendance.objects.count(), 2)