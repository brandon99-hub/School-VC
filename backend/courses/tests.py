from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from students.models import Student
from teachers.models import Teacher
from .models import Course, Module, Lesson, LessonContent


class CourseDetailAPITest(APITestCase):
    def setUp(self):
        self.teacher_user = Student.objects.create_user(
            student_id='T001',
            email='teacher@example.com',
            password='testpass123',
            first_name='Test',
            last_name='Teacher',
        )
        self.teacher = Teacher.objects.create(
            user=self.teacher_user,
            teacher_id='TT001',
            date_of_birth='1990-01-01',
            qualification='Masters',
            specialization='Math',
            experience_years=5,
            address='123 Street',
            phone='123456789',
        )
        self.student_user = Student.objects.create_user(
            student_id='S001',
            email='student@example.com',
            password='testpass123',
            first_name='Test',
            last_name='Student',
        )

        self.course = Course.objects.create(
            name='Algebra I',
            code='ALG101',
            description='Introductory algebra course',
            credits=3,
            semester='1',
            start_date='2025-01-10',
            end_date='2025-05-20',
            teacher=self.teacher,
        )
        self.course.students.add(self.student_user)

        module = Module.objects.create(course=self.course, title='Foundations', order=1, is_published=True)
        lesson = Lesson.objects.create(
            module=module,
            title='Variables 101',
            order=1,
            duration_minutes=20,
            is_published=True,
        )
        LessonContent.objects.create(
            lesson=lesson,
            content_type='video',
            title='What is a variable?',
            resource_url='https://example.com/video',
            order=1,
        )

    def test_enrolled_student_can_view_learning_path(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse('courses:course_detail_api', args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('modules', data)
        self.assertEqual(len(data['modules']), 1)
        self.assertEqual(data['modules'][0]['lessons'][0]['contents'][0]['title'], 'What is a variable?')

    def test_non_enrolled_student_gets_forbidden(self):
        other_student = Student.objects.create_user(
            student_id='S002',
            email='other@example.com',
            password='testpass123',
            first_name='Other',
            last_name='Student',
        )
        self.client.force_authenticate(user=other_student)
        url = reverse('courses:course_detail_api', args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
