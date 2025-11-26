# students/models.py
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models

class StudentManager(BaseUserManager):
    def create_user(self, student_id, password=None, **extra_fields):
        if not student_id:
            raise ValueError('The Student ID field must be set')
        extra_fields.setdefault('username', extra_fields.get('email') or student_id)
        user = self.model(student_id=student_id, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, student_id, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(student_id, password, **extra_fields)

class Student(AbstractUser):
    email = models.EmailField(unique=True)
    student_id = models.CharField(max_length=20, unique=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], null=True, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=15, blank=True)
    grade = models.CharField(max_length=10, blank=True)
    # Legacy M2M kept for backwards compatibility. Active enrollment should
    # use Course.students -> Student.enrolled_courses reverse relation.
    courses = models.ManyToManyField('courses.Course', related_name='enrolled_students', blank=True)
    date_joined = models.DateField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['student_id', 'first_name', 'last_name']
    objects = StudentManager()

    def __str__(self):
        return f"{self.get_full_name()} ({self.student_id})"

    @property
    def enrolled_courses_qs(self):
        """
        Helper to keep a single source of truth for course enrollment.
        Course.enrolled_students m2m already builds a reverse relation called
        `enrolled_courses`, so lean on that rather than the legacy `courses` m2m.
        """
        return self.enrolled_courses.all()

    def get_enrolled_courses(self):
        return self.enrolled_courses_qs

    def get_attendance_percentage(self):
        total_attendance = self.student_attendance.count()
        present_attendance = self.student_attendance.filter(status='Present').count()
        if total_attendance == 0:
            return 0
        return (present_attendance / total_attendance) * 100

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late')
    ]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='student_attendance')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ['student', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.student} - {self.date} - {self.status}"