"""
Notification models for CBC LMS
"""

from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from students.models import Student, Parent
from teachers.models import Teacher


class Notification(models.Model):
    """
    Universal notification model for all user types
    """
    NOTIFICATION_TYPES = [
        ('assignment_graded', 'Assignment Graded'),
        ('competency_assessed', 'Competency Assessed'),
        ('new_assignment', 'New Assignment'),
        ('parent_message', 'Parent Message'),
        ('teacher_message', 'Teacher Message'),
        ('report_ready', 'Report Ready'),
        ('general', 'General Notification'),
    ]
    
    # Recipient (can be student, parent, or teacher)
    recipient_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    recipient_id = models.PositiveIntegerField()
    recipient = GenericForeignKey('recipient_type', 'recipient_id')
    
    # Notification details
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Optional link to related object
    link_url = models.CharField(max_length=500, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient_type', 'recipient_id', 'is_read']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.notification_type}: {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


# Helper functions for creating notifications

def notify_student(student, notification_type, title, message, link_url=''):
    """Create a notification for a student"""
    from django.contrib.contenttypes.models import ContentType
    Notification.objects.create(
        recipient_type=ContentType.objects.get_for_model(Student),
        recipient_id=student.id,
        notification_type=notification_type,
        title=title,
        message=message,
        link_url=link_url
    )


def notify_parent(parent, notification_type, title, message, link_url=''):
    """Create a notification for a parent"""
    from django.contrib.contenttypes.models import ContentType
    Notification.objects.create(
        recipient_type=ContentType.objects.get_for_model(Parent),
        recipient_id=parent.id,
        notification_type=notification_type,
        title=title,
        message=message,
        link_url=link_url
    )


def notify_teacher(teacher, notification_type, title, message, link_url=''):
    """Create a notification for a teacher"""
    from django.contrib.contenttypes.models import ContentType
    Notification.objects.create(
        recipient_type=ContentType.objects.get_for_model(Teacher),
        recipient_id=teacher.id,
        notification_type=notification_type,
        title=title,
        message=message,
        link_url=link_url
    )


def notify_parents_of_student(student, notification_type, title, message, link_url=''):
    """Notify all parents of a student"""
    for parent in student.parents.all():
        notify_parent(parent, notification_type, title, message, link_url)
