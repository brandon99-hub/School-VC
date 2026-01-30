from django.conf import settings
from django.db import models
from teachers.models import Teacher
from students.models import Student

class Course(models.Model):
    SEMESTER_CHOICES = [
        ('1', 'First'),
        ('2', 'Second'),
        ('3', 'Third'),
        ('4', 'Fourth')
    ]

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField()
    credits = models.PositiveIntegerField()
    semester = models.CharField(max_length=1, choices=SEMESTER_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    students = models.ManyToManyField(Student, related_name='enrolled_courses')
    
    # CBC Integration
    learning_area = models.ForeignKey(
        'cbc.LearningArea', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='assigned_courses',
        help_text="Link to the official CBC Learning Area registry entry"
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

    def get_enrolled_students_count(self):
        return self.students.count()

class Assignment(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Submitted', 'Submitted'),
        ('Graded', 'Graded')
    ]
    
    ASSESSMENT_TYPE_CHOICES = [
        ('formative', 'Formative Assessment'),
        ('summative', 'Summative Assessment'),
    ]

    # Traditional fields (for 8-4-4 compatibility)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField()
    total_marks = models.PositiveIntegerField(null=True, blank=True)  # Only for traditional grading
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
    
    # CBC fields (NEW)
    learning_area = models.ForeignKey(
        'cbc.LearningArea',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='assignments'
    )
    learning_outcome = models.ForeignKey(
        'cbc.LearningOutcome',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assignments',
        help_text="Primary learning outcome being assessed (deprecated in favor of tested_outcomes)"
    )
    tested_outcomes = models.ManyToManyField(
        'cbc.LearningOutcome',
        blank=True,
        related_name='assignments_m2m',
        help_text="Learning outcomes being assessed"
    )
    assessment_type = models.CharField(
        max_length=20,
        choices=ASSESSMENT_TYPE_CHOICES,
        default='formative',
        help_text="Type of CBC assessment"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['due_date']

    def __str__(self):
        if self.learning_area:
            return f"{self.title} - {self.learning_area}"
        return f"{self.title} - {self.course}"
    
    @property
    def is_cbc(self):
        """Returns True if this is a CBC assignment"""
        return self.learning_outcome is not None or self.tested_outcomes.exists()

    @property
    def teacher_id(self):
        """Resolves the teacher ID for this assignment"""
        if self.learning_area and self.learning_area.teacher:
            return self.learning_area.teacher.id
        if self.course and self.course.teacher:
            return self.course.teacher.id
        return None

class Schedule(models.Model):
    DAY_CHOICES = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday')
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room_number = models.CharField(max_length=10)

    class Meta:
        unique_together = ['day', 'start_time', 'room_number']
        ordering = ['day', 'start_time']

    def __str__(self):
        return f"{self.course} - {self.day} ({self.start_time} - {self.end_time})"

class Grade(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='grades')  # Added related_name
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, null=True)
    score = models.DecimalField(max_digits=5, decimal_places=2)
    letter_grade = models.CharField(max_length=2, blank=True)

class Attendance(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='course_attendance')  # Added related_name
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=[('present', 'Present'), ('absent', 'Absent'), ('late', 'Late')])


class Module(models.Model):
    learning_area = models.ForeignKey('cbc.LearningArea', on_delete=models.CASCADE, related_name='lms_modules', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)
    is_published = models.BooleanField(default=False)
    release_date = models.DateField(blank=True, null=True)

    class Meta:
        ordering = ['learning_area', 'order']
        unique_together = ('learning_area', 'order')

    def __str__(self):
        return f"{self.learning_area.code if self.learning_area else 'N/A'} · {self.title}"


class Lesson(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    summary = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)
    duration_minutes = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)
    release_date = models.DateField(blank=True, null=True)

    class Meta:
        ordering = ['module', 'order']
        unique_together = ('module', 'order')

    def __str__(self):
        return f"{self.module.title} · {self.title}"


class LessonContent(models.Model):
    VIDEO = 'video'
    DOCUMENT = 'document'
    TEXT = 'text'
    QUIZ = 'quiz'
    CONTENT_CHOICES = [
        (VIDEO, 'Video'),
        (DOCUMENT, 'Document'),
        (TEXT, 'Rich Text'),
        (QUIZ, 'Quiz Reference'),
    ]

    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='contents')
    content_type = models.CharField(max_length=20, choices=CONTENT_CHOICES)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    resource_url = models.URLField(blank=True)
    embed_url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['lesson', 'order']
        unique_together = ('lesson', 'order')

    def __str__(self):
        return f"{self.lesson.title} · {self.title}"


class Quiz(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='quizzes', null=True, blank=True)
    title = models.CharField(max_length=200)
    instructions = models.TextField(blank=True)
    time_limit_minutes = models.PositiveIntegerField(default=0)
    max_attempts = models.PositiveIntegerField(default=1)
    is_published = models.BooleanField(default=False)
    due_date = models.DateTimeField(null=True, blank=True)

    # CBC fields
    learning_area = models.ForeignKey(
        'cbc.LearningArea',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='quizzes'
    )
    learning_outcome = models.ForeignKey(
        'cbc.LearningOutcome',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quizzes',
        help_text="Primary learning outcome being assessed (deprecated in favor of tested_outcomes)"
    )
    tested_outcomes = models.ManyToManyField(
        'cbc.LearningOutcome',
        blank=True,
        related_name='quizzes_m2m',
        help_text="Learning outcomes being assessed"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['lesson', 'title']

    def __str__(self):
        return f"{self.lesson.title if self.lesson else (self.learning_area.name if self.learning_area else 'N/A')} · {self.title}"

    @property
    def total_points(self):
        return sum(q.points for q in self.questions.all())


class QuizQuestion(models.Model):
    MULTIPLE_CHOICE = 'multiple_choice'
    SHORT_ANSWER = 'short_answer'
    TRUE_FALSE = 'true_false'
    QUESTION_TYPES = [
        (MULTIPLE_CHOICE, 'Multiple Choice'),
        (SHORT_ANSWER, 'Short Answer'),
        (TRUE_FALSE, 'True / False'),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    prompt = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default=MULTIPLE_CHOICE)
    choices = models.JSONField(blank=True, null=True)
    correct_answer = models.JSONField()
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['quiz', 'order']
        unique_together = ('quiz', 'order')

    def __str__(self):
        return f"{self.quiz.title} · Q{self.order}"


class QuizSubmission(models.Model):
    STATUS_CHOICES = [
        ('in_review', 'In Review'),
        ('graded', 'Graded'),
        ('auto_graded', 'Auto Graded'),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='quiz_submissions')
    attempt_number = models.PositiveIntegerField(default=1)
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_review')
    grader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_quiz_submissions'
    )
    feedback = models.TextField(blank=True)

    class Meta:
        ordering = ['-submitted_at']
        unique_together = ('quiz', 'student', 'attempt_number')

    def __str__(self):
        return f"{self.quiz.title} · {self.student.get_full_name()} · Attempt {self.attempt_number}"

    def get_competency_level(self):
        """Calculates competency level based on score percentage"""
        if self.score is None:
            return None
        
        total = self.quiz.total_points
        if not total or total == 0:
            return None
            
        percentage = (float(self.score) / float(total)) * 100
        
        if percentage >= 80:
            return 'EE'
        elif percentage >= 60:
            return 'ME'
        elif percentage >= 40:
            return 'AE'
        else:
            return 'BE'


class QuizResponse(models.Model):
    submission = models.ForeignKey(QuizSubmission, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE)
    response = models.JSONField()
    is_correct = models.BooleanField(default=False)
    feedback = models.TextField(blank=True)

    class Meta:
        unique_together = ('submission', 'question')


class AssignmentSubmission(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
        ('late', 'Late Submission'),
    ]
    
    COMPETENCY_LEVELS = [
        ('EE', 'Exceeding Expectations'),
        ('ME', 'Meeting Expectations'),
        ('AE', 'Approaching Expectations'),
        ('BE', 'Below Expectations'),
    ]

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='assignment_submissions')
    submitted_at = models.DateTimeField(auto_now_add=True)
    file_url = models.URLField(blank=True)
    file = models.FileField(upload_to='submissions/', blank=True, null=True)
    text_response = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    feedback = models.TextField(blank=True)
    
    # Traditional grading (for 8-4-4)
    grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # CBC grading (NEW)
    competency_level = models.CharField(
        max_length=2,
        choices=COMPETENCY_LEVELS,
        null=True,
        blank=True,
        help_text="CBC competency level achieved"
    )
    competency_comment = models.TextField(
        blank=True,
        help_text="Teacher's comment on competency achievement"
    )

    class Meta:
        ordering = ['-submitted_at']
        unique_together = ('assignment', 'student')

    def __str__(self):
        return f"{self.assignment.title} · {self.student.get_full_name()}"
    
    @property
    def is_cbc_graded(self):
        """Returns True if graded using CBC rubric"""
        return self.competency_level is not None


class DiscussionThread(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='discussion_threads')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='threads', blank=True, null=True)
    title = models.CharField(max_length=200)
    body = models.TextField()
    created_by = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='created_threads')
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"{self.course.code} · {self.title}"


class DiscussionComment(models.Model):
    thread = models.ForeignKey(DiscussionThread, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='discussion_comments')
    body = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.get_full_name()} on {self.thread.title}"
