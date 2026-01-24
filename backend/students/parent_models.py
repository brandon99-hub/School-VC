# students/models.py - Parent model
from django.db import models


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
    children = models.ManyToManyField('Student', related_name='parents', blank=True)
    
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
