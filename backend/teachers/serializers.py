from rest_framework import serializers
from courses.models import Course, Assignment
from students.models import Student


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


class CourseSerializer(serializers.ModelSerializer):
    """Enhanced course serializer with nested student and assignment data"""
    enrolled_students_count = serializers.SerializerMethodField()
    enrolled_students = EnrolledStudentSerializer(many=True, read_only=True, source='students')
    assignments = serializers.SerializerMethodField()
    modules = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'start_date', 'end_date', 'is_active', 'credits', 'semester',
            'enrolled_students_count', 'enrolled_students', 'assignments', 'modules'
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
