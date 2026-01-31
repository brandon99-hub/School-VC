from django.db import models
from django.conf import settings

class Club(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(
        'teachers.Teacher', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='managed_clubs'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class EventNotice(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    TARGET_TYPE_CHOICES = [
        ('all', 'School-wide'),
        ('grades', 'Specific Grades'),
        ('clubs', 'Specific Clubs'),
    ]
    target_type = models.CharField(max_length=10, choices=TARGET_TYPE_CHOICES, default='all')
    target_grades = models.ManyToManyField('cbc.GradeLevel', blank=True, related_name='event_notices')
    target_clubs = models.ManyToManyField(Club, blank=True, related_name='event_notices')
    
    start_date = models.DateField()
    end_date = models.DateField()
    location = models.CharField(max_length=200, blank=True)
    
    has_fee = models.BooleanField(default=False)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class AttendanceRecord(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    date = models.DateField()
    is_present = models.BooleanField(default=True)
    remarks = models.TextField(blank=True)

    class Meta:
        abstract = True

class ClubAttendance(AttendanceRecord):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='session_attendance')
    
    class Meta:
        unique_together = ['club', 'student', 'date']

class EventAttendance(AttendanceRecord):
    event = models.ForeignKey(EventNotice, on_delete=models.CASCADE, related_name='attendance')
    
    class Meta:
        unique_together = ['event', 'student', 'date']
