from django.db import models
from django.conf import settings  # Changed import

class StudentProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,  # Updated reference
        on_delete=models.CASCADE
    )
    student_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)

class TeacherProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,  # Updated reference
        on_delete=models.CASCADE
    )
    teacher_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)

class AdminProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,  # Updated reference
        on_delete=models.CASCADE
    )
    name = models.CharField(max_length=100)

class Announcement(models.Model):
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Urgent', 'Urgent')
    ]

    title = models.CharField(max_length=200)
    content = models.TextField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Updated reference
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Medium')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Updated reference
        on_delete=models.CASCADE
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.username}"

class AcademicYear(models.Model):
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_current:
            AcademicYear.objects.exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)

class AccessLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Updated reference
        on_delete=models.CASCADE,
        null=True
    )
    path = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    status_code = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.path} - {self.method} - {self.status_code}"