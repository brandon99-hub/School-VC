from rest_framework import serializers
from courses.models import Course, Assignment
from students.models import Student
from cbc.models import LearningArea

class AssignmentSerializer(serializers.ModelSerializer):
    """Serializer for Assignment model with essential fields"""
    class Meta:
        model = Assignment
        fields = ['id', 'title', 'due_date', 'description']


class EnrolledStudentSerializer(serializers.ModelSerializer):
    """Serializer for students with computed name field"""
    name = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = ['id', 'name', 'email', 'student_id']
    
    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class LearningAreaSerializer(serializers.ModelSerializer):
    """Serializer for CBC Learning Areas mapped to frontend expectations"""
    enrolled_students_count = serializers.IntegerField(source='get_enrolled_students_count', read_only=True)
    enrolled_students = EnrolledStudentSerializer(many=True, read_only=True, source='students')
    assignments = AssignmentSerializer(many=True, read_only=True)
    modules = serializers.SerializerMethodField()
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    teacher = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    progress = serializers.IntegerField(default=0, read_only=True)
    
    class Meta:
        model = LearningArea
        fields = [
            'id', 'name', 'code', 'is_active', 'grade_level_name', 'teacher_name', 'teacher',
            'enrolled_students_count', 'enrolled_students', 'assignments', 'modules', 'progress'
        ]
    
    def get_modules(self, obj):
        # Map Strands to "Modules" for frontend compatibility
        from cbc.serializers import StrandDetailSerializer
        strands = obj.strands.all().order_by('order')
        return StrandDetailSerializer(strands, many=True).data

class CourseSerializer(serializers.ModelSerializer):
    """Enhanced course serializer with nested student and assignment data"""
    enrolled_students_count = serializers.SerializerMethodField()
    enrolled_students = EnrolledStudentSerializer(many=True, read_only=True, source='students')
    assignments = serializers.SerializerMethodField()
    modules = serializers.SerializerMethodField()
    grade_level_name = serializers.CharField(source='learning_area.grade_level.name', read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'start_date', 'end_date', 'is_active', 'credits', 'semester',
            'learning_area', 'grade_level_name', 'enrolled_students_count', 'enrolled_students', 'assignments', 'modules'
        ]
    
    def get_enrolled_students_count(self, obj):
        return obj.students.count()
    
    def get_assignments(self, obj):
        # Get assignments for this course
        assignments = obj.assignment_set.all()
        return AssignmentSerializer(assignments, many=True).data
    
    def get_modules(self, obj):
        # Import here to avoid circular dependency
        from courses.serializers import ModuleSerializer
        modules = obj.modules.all().order_by('order')
        return ModuleSerializer(modules, many=True).data
