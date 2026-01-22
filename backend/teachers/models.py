from django.db import models
from django.conf import settings  # Changed import

class Teacher(models.Model):
    QUALIFICATION_CHOICES = [
        ('Bachelors', 'Bachelors'),
        ('Masters', 'Masters'),
        ('PhD', 'PhD'),
        ('Other', 'Other')
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,  # Updated reference
        on_delete=models.CASCADE
    )
    teacher_id = models.CharField(max_length=20, unique=True)
    date_of_birth = models.DateField()
    qualification = models.CharField(max_length=20, choices=QUALIFICATION_CHOICES)
    specialization = models.CharField(max_length=100)
    experience_years = models.PositiveIntegerField()
    address = models.TextField()
    phone = models.CharField(max_length=15)
    date_joined = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ['user__last_name', 'user__first_name']

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.teacher_id})"

    def get_assigned_courses(self):
        return self.course_set.all()

    def get_total_students(self):
        return sum(course.enrolled_students.count() for course in self.course_set.all())

class TeacherAttendance(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Leave', 'Leave')
    ]

    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    leave_reason = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ['teacher', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.teacher} - {self.date} - {self.status}"
