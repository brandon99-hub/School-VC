from django.db import models
from django.conf import settings
from teachers.models import Teacher
from students.models import Student


class GradeLevel(models.Model):
    """Represents a grade level in the school (e.g., Grade 4, Form 3)"""
    CURRICULUM_CHOICES = [
        ('CBC', 'Competency-Based Curriculum'),
        ('8-4-4', 'Traditional 8-4-4'),
    ]
    
    name = models.CharField(max_length=20)  # "Grade 4", "Form 3"
    curriculum_type = models.CharField(max_length=10, choices=CURRICULUM_CHOICES)
    order = models.IntegerField(unique=True)  # For sorting (1-12)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order']
        verbose_name = 'Grade Level'
        verbose_name_plural = 'Grade Levels'
    
    def __str__(self):
        return f"{self.name} ({self.curriculum_type})"
    
    @property
    def is_cbc(self):
        return self.curriculum_type == 'CBC'


class LearningArea(models.Model):
    """CBC Learning Area (replaces traditional 'subject' for CBC)"""
    name = models.CharField(max_length=100)  # "Mathematics", "Science & Technology"
    code = models.CharField(max_length=20, unique=True)  # "MATH-G4"
    grade_level = models.ForeignKey(GradeLevel, on_delete=models.CASCADE, related_name='learning_areas')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='learning_areas', null=True, blank=True)
    students = models.ManyToManyField(Student, related_name='learning_areas', blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['grade_level', 'name']
        verbose_name = 'Learning Area'
        verbose_name_plural = 'Learning Areas'
        unique_together = ['name', 'grade_level']
    
    def __str__(self):
        return f"{self.name} - {self.grade_level.name}"
    
    @property
    def is_cbc(self):
        return self.grade_level.is_cbc
    
    def get_enrolled_students_count(self):
        return self.students.count()


class Strand(models.Model):
    """CBC Strand - major theme within a Learning Area"""
    learning_area = models.ForeignKey(LearningArea, on_delete=models.CASCADE, related_name='strands')
    name = models.CharField(max_length=200)  # "Numbers", "Measurement", "Geometry"
    code = models.CharField(max_length=50, unique=True)  # "MATH-G4-NUMBERS"
    description = models.TextField(blank=True)
    order = models.IntegerField()
    
    class Meta:
        ordering = ['learning_area', 'order']
        verbose_name = 'Strand'
        verbose_name_plural = 'Strands'
        unique_together = ['learning_area', 'order']
    
    def __str__(self):
        return f"{self.learning_area.name} - {self.name}"


class SubStrand(models.Model):
    """CBC Sub-Strand - specific topic within a Strand"""
    strand = models.ForeignKey(Strand, on_delete=models.CASCADE, related_name='sub_strands')
    name = models.CharField(max_length=200)  # "Whole Numbers", "Fractions", "Addition"
    code = models.CharField(max_length=50, unique=True)  # "MATH-G4-NUM-WHOLE"
    description = models.TextField(blank=True)
    order = models.IntegerField()
    
    class Meta:
        ordering = ['strand', 'order']
        verbose_name = 'Sub-Strand'
        verbose_name_plural = 'Sub-Strands'
        unique_together = ['strand', 'order']
    
    def __str__(self):
        return f"{self.strand.name} - {self.name}"


class LearningOutcome(models.Model):
    """Specific competency students must achieve"""
    sub_strand = models.ForeignKey(SubStrand, on_delete=models.CASCADE, related_name='learning_outcomes')
    description = models.TextField()  # "Add numbers up to 10,000 with regrouping"
    code = models.CharField(max_length=50, unique=True)  # "MATH-G4-NUM-WHOLE-01"
    order = models.IntegerField()
    suggested_activities = models.TextField(blank=True, help_text="Suggested teaching activities")
    
    class Meta:
        ordering = ['sub_strand', 'order']
        verbose_name = 'Learning Outcome'
        verbose_name_plural = 'Learning Outcomes'
        unique_together = ['sub_strand', 'order']
    
    def __str__(self):
        return f"{self.code}: {self.description[:50]}..."
    
    @property
    def full_path(self):
        """Returns full hierarchical path"""
        return f"{self.sub_strand.strand.learning_area.name} > {self.sub_strand.strand.name} > {self.sub_strand.name} > {self.description}"


class CompetencyAssessment(models.Model):
    """Records student competency achievement for a learning outcome"""
    COMPETENCY_LEVELS = [
        ('EE', 'Exceeding Expectations'),
        ('ME', 'Meeting Expectations'),
        ('AE', 'Approaching Expectations'),
        ('BE', 'Below Expectations'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='competency_assessments')
    learning_outcome = models.ForeignKey(LearningOutcome, on_delete=models.CASCADE, related_name='assessments')
    competency_level = models.CharField(max_length=2, choices=COMPETENCY_LEVELS)
    assessment_date = models.DateField(auto_now_add=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='competency_assessments')
    teacher_comment = models.TextField(blank=True, help_text="Specific feedback on student's performance")
    evidence = models.TextField(help_text="What the student did to demonstrate this competency")
    
    # Link to assignment submission if applicable
    assignment_submission = models.ForeignKey(
        'courses.AssignmentSubmission',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='competency_assessments'
    )
    
    class Meta:
        ordering = ['-assessment_date']
        verbose_name = 'Competency Assessment'
        verbose_name_plural = 'Competency Assessments'
        indexes = [
            models.Index(fields=['student', 'learning_outcome']),
            models.Index(fields=['assessment_date']),
        ]
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.learning_outcome.code} - {self.competency_level}"
    
    def get_competency_display_full(self):
        """Returns full competency level description"""
        return dict(self.COMPETENCY_LEVELS).get(self.competency_level)
