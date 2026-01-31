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
    grade_level = models.ForeignKey(
        'cbc.GradeLevel',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    # Legacy M2M kept for backwards compatibility. Active enrollment should
    # use Course.students -> Student.enrolled_courses reverse relation.
    club = models.ForeignKey(
        'events.Club', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='members'
    )
    # Legacy M2M kept for backwards compatibility. Active enrollment should
    # use Course.students -> Student.enrolled_courses reverse relation.
    courses = models.ManyToManyField('courses.Course', related_name='enrolled_students', blank=True)
    credit_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Carried forward overpayments")
    date_joined = models.DateField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['student_id', 'first_name', 'last_name']
    objects = StudentManager()

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_grade_level = None
        if not is_new:
            try:
                old_grade_level = Student.objects.get(pk=self.pk).grade_level
            except Student.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # If grade_level changed or student is new, update CBC learning areas
        if self.grade_level and (is_new or self.grade_level != old_grade_level):
            from cbc.models import LearningArea
            areas = LearningArea.objects.filter(grade_level=self.grade_level, is_active=True)
            for area in areas:
                area.students.add(self)

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
    learning_area = models.ForeignKey(
        'cbc.LearningArea', 
        on_delete=models.CASCADE, 
        related_name='attendance_records',
        null=True,
        blank=True
    )
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.student} - {self.date} - {self.status}"


class Parent(models.Model):
    """
    Parent/Guardian model for accessing student progress
    """
    # Authentication fields
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)  # Hashed password
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    
    # Contact information
    phone = models.CharField(max_length=15)
    address = models.TextField(blank=True)
    
    # Relationship to students
    children = models.ManyToManyField(Student, related_name='parents', blank=True)
    
    # Account management
    is_active = models.BooleanField(default=True)
    email_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=100, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Parent'
        verbose_name_plural = 'Parents'
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_children_count(self):
        return self.children.count()
    
    def set_password(self, raw_password):
        """Hash and set password"""
        from django.contrib.auth.hashers import make_password
        self.password_hash = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Check if provided password matches"""
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.password_hash)
    
    def get_all_learning_areas(self):
        """Get all learning areas for all children"""
        from cbc.models import LearningArea
        return LearningArea.objects.filter(students__in=self.children.all()).distinct()
