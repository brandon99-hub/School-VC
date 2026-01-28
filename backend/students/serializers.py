from rest_framework import serializers
from .models import Student, Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['student', 'date', 'status']

class StudentSerializer(serializers.ModelSerializer):
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)
    name = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'username', 'email', 'name', 'first_name', 'last_name', 
            'student_id', 'date_of_birth', 'gender', 'grade', 
            'grade_level', 'grade_level_name', 'address', 'phone', 'credit_balance'
        ]

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()