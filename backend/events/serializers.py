from rest_framework import serializers
from .models import Club, EventNotice, ClubAttendance, EventAttendance
from students.models import Student
from teachers.models import Teacher

class ClubSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source='teacher.user.get_full_name')
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Club
        fields = ['id', 'name', 'description', 'teacher', 'teacher_name', 'member_count', 'created_at']

    def get_member_count(self, obj):
        return obj.members.count()

class EventNoticeSerializer(serializers.ModelSerializer):
    fee_status = serializers.SerializerMethodField()

    class Meta:
        model = EventNotice
        fields = [
            'id', 'title', 'description', 'target_type', 
            'target_grades', 'target_clubs', 'start_date', 'end_date', 
            'location', 'has_fee', 'cost', 'fee_status', 'created_at'
        ]

    def get_fee_status(self, obj):
        request = self.context.get('request')
        if not request or not obj.has_fee:
            return None
        
        # This will be refined in the view based on child_id
        # For now, it's a placeholder to be used in context-aware views
        return getattr(obj, 'current_student_fee_status', 'pending')

class ClubAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.get_full_name')

    class Meta:
        model = ClubAttendance
        fields = ['id', 'club', 'student', 'student_name', 'date', 'is_present', 'remarks']

class EventAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.get_full_name')

    class Meta:
        model = EventAttendance
        fields = ['id', 'event', 'student', 'student_name', 'date', 'is_present', 'remarks']
