"""
Assessment template models for CBC
"""

from django.db import models
from teachers.models import Teacher
from cbc.models import LearningArea, GradeLevel, LearningOutcome


class AssessmentTemplate(models.Model):
    """
    Reusable assessment rubric templates for CBC grading
    """
    name = models.CharField(max_length=200, help_text="e.g., 'Grade 4 Math - Addition'")
    learning_area = models.ForeignKey(LearningArea, on_delete=models.CASCADE, related_name='assessment_templates')
    grade_level = models.ForeignKey(GradeLevel, on_delete=models.CASCADE, related_name='assessment_templates')
    description = models.TextField(blank=True, help_text="Optional description of when to use this template")
    
    # CBC Rubric Criteria
    criteria_ee = models.TextField(help_text="Exceeding Expectations criteria")
    criteria_me = models.TextField(help_text="Meeting Expectations criteria")
    criteria_ae = models.TextField(help_text="Approaching Expectations criteria")
    criteria_be = models.TextField(help_text="Below Expectations criteria")
    
    # Metadata
    created_by = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='created_templates')
    is_shared = models.BooleanField(default=False, help_text="Share with other teachers")
    usage_count = models.IntegerField(default=0, help_text="Number of times this template has been used")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-usage_count', '-created_at']
        indexes = [
            models.Index(fields=['learning_area', 'grade_level']),
            models.Index(fields=['-usage_count']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.learning_area.name})"
    
    def increment_usage(self):
        """Increment usage count when template is used"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])


class BulkGradingSession(models.Model):
    """
    Track bulk grading sessions for progress monitoring
    """
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    assignment = models.ForeignKey('courses.Assignment', on_delete=models.CASCADE, related_name='grading_sessions')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='grading_sessions')
    
    total_submissions = models.IntegerField(default=0)
    graded_count = models.IntegerField(default=0)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='in_progress')
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Grading session for {self.assignment.title} - {self.graded_count}/{self.total_submissions}"
    
    def update_progress(self):
        """Update graded count"""
        from cbc.models import CompetencyAssessment
        self.graded_count = CompetencyAssessment.objects.filter(
            learning_outcome__in=self.assignment.learning_outcomes.all(),
            student__in=self.assignment.submissions.values_list('student', flat=True)
        ).count()
        
        if self.graded_count >= self.total_submissions:
            self.status = 'completed'
            from django.utils import timezone
            self.completed_at = timezone.now()
        
        self.save(update_fields=['graded_count', 'status', 'completed_at'])


class AssessmentEvidence(models.Model):
    """
    Evidence files for competency assessments (photos, documents, observations)
    """
    EVIDENCE_TYPES = [
        ('photo', 'Photo'),
        ('document', 'Document'),
        ('observation', 'Observation Note'),
        ('video', 'Video'),
    ]
    
    competency_assessment = models.ForeignKey(
        'cbc.CompetencyAssessment',
        on_delete=models.CASCADE,
        related_name='evidence_files'  # Changed from 'evidence' to avoid conflict
    )
    evidence_type = models.CharField(max_length=15, choices=EVIDENCE_TYPES)
    file_url = models.FileField(upload_to='assessment_evidence/', null=True, blank=True)
    description = models.TextField(help_text="Description of the evidence")
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.evidence_type} for assessment {self.competency_assessment.id}"
