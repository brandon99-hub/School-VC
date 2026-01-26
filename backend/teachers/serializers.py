from rest_framework import serializers
from courses.models import Course, Assignment
from students.models import Student
from cbc.models import LearningArea

class AssignmentSerializer(serializers.ModelSerializer):
    """Serializer for Assignment model with essential fields and CBC support"""
    strand_id = serializers.SerializerMethodField()
    sub_strand_id = serializers.SerializerMethodField()
    learning_outcome_description = serializers.CharField(source='learning_outcome.description', read_only=True)
    
    teacher = serializers.SerializerMethodField()
    submission_count = serializers.SerializerMethodField()
    graded_submissions_count = serializers.SerializerMethodField()
    tested_outcomes_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'due_date', 'description', 'total_marks', 'status',
            'learning_area', 'learning_outcome', 'assessment_type',
            'strand_id', 'sub_strand_id', 'learning_outcome_description', 'teacher',
            'submission_count', 'graded_submissions_count', 'tested_outcomes', 'tested_outcomes_detail'
        ]
        
    def get_tested_outcomes_detail(self, obj):
        from cbc.serializers import LearningOutcomeListSerializer
        outcomes = obj.tested_outcomes.all()
        return LearningOutcomeListSerializer(outcomes, many=True).data

    def get_teacher(self, obj):
        return obj.teacher_id
        
    def get_submission_count(self, obj):
        return obj.submissions.count()

    def get_graded_submissions_count(self, obj):
        return obj.submissions.filter(status='graded').count()
        
    def get_strand_id(self, obj):
        if obj.learning_outcome:
            return obj.learning_outcome.sub_strand.strand_id
        return None

    def get_sub_strand_id(self, obj):
        if obj.learning_outcome:
            return obj.learning_outcome.sub_strand_id
        return None


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
    # New fields for CourseDetail visibility
    quizzes = serializers.SerializerMethodField()
    student_submissions = serializers.SerializerMethodField()
    learning_summary = serializers.SerializerMethodField()
    student_progress = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = LearningArea
        fields = [
            'id', 'name', 'code', 'is_active', 'grade_level_name', 'teacher_name', 'teacher',
            'enrolled_students_count', 'enrolled_students', 'assignments', 'modules', 'progress',
            'quizzes', 'student_submissions', 'learning_summary', 'student_progress'
        ]
    
    def get_progress(self, obj):
        # Placeholder for dynamic progress calculation
        return 0
    
    def get_modules(self, obj):
        # Map Strands to "Modules" for frontend compatibility
        from cbc.serializers import StrandDetailSerializer
        strands = obj.strands.all().order_by('order')
        return StrandDetailSerializer(strands, many=True).data

    def get_quizzes(self, obj):
        from courses.models import Quiz
        from courses.serializers import QuizSerializer
        quizzes = Quiz.objects.filter(learning_area=obj, is_published=True)
        return QuizSerializer(quizzes, many=True).data

    def get_student_submissions(self, obj):
        request = self.context.get('request')
        student = getattr(request.user, 'student', None) if request and request.user.is_authenticated else None
        
        from courses.models import AssignmentSubmission, QuizSubmission
        from courses.serializers import AssignmentSubmissionSerializer, QuizSubmissionSerializer
        
        assignment_subs = AssignmentSubmission.objects.filter(assignment__learning_area=obj)
        quiz_subs = QuizSubmission.objects.filter(quiz__learning_area=obj)
        
        if student:
            assignment_subs = assignment_subs.filter(student=student)
            quiz_subs = quiz_subs.filter(student=student)
        
        return {
            'assignments': AssignmentSubmissionSerializer(assignment_subs, many=True).data,
            'quizzes': QuizSubmissionSerializer(quiz_subs, many=True).data
        }

    def get_learning_summary(self, obj):
        from cbc.models import SubStrand
        sub_strand_count = SubStrand.objects.filter(strand__learning_area=obj).count()
        return {
            'published_lessons': sub_strand_count,
            'quiz_count': obj.quizzes.filter(is_published=True).count(),
            'assignment_count': obj.assignments.count()
        }

    def get_student_progress(self, obj):
        request = self.context.get('request')
        student = getattr(request.user, 'student', None) if request and request.user.is_authenticated else None
        if not student:
            return {}
        
        from courses.models import QuizSubmission
        completed_quizzes = QuizSubmission.objects.filter(
            student=student, 
            quiz__learning_area=obj, 
            status='completed'
        ).count()
        
        return {
            'completed_quizzes': completed_quizzes,
            'overall_progress': 0
        }

class CourseSerializer(serializers.ModelSerializer):
    """Enhanced course serializer with nested student and assignment data"""
    enrolled_students_count = serializers.SerializerMethodField()
    enrolled_students = EnrolledStudentSerializer(many=True, read_only=True, source='students')
    assignments = serializers.SerializerMethodField()
    modules = serializers.SerializerMethodField()
    grade_level_name = serializers.CharField(source='learning_area.grade_level.name', read_only=True)
    student_submissions = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'start_date', 'end_date', 'is_active', 'credits', 'semester',
            'learning_area', 'grade_level_name', 'enrolled_students_count', 'enrolled_students', 
            'assignments', 'modules', 'student_submissions'
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

    def get_student_submissions(self, obj):
        request = self.context.get('request')
        student = getattr(request.user, 'student', None) if request and request.user.is_authenticated else None
        if not student:
            return {'assignments': [], 'quizzes': []}
        
        from courses.models import AssignmentSubmission, QuizSubmission
        from courses.serializers import AssignmentSubmissionSerializer, QuizSubmissionSerializer
        
        assignment_subs = AssignmentSubmission.objects.filter(assignment__course=obj, student=student)
        quiz_subs = QuizSubmission.objects.filter(quiz__lesson__module__course=obj, student=student)
        
        return {
            'assignments': AssignmentSubmissionSerializer(assignment_subs, many=True).data,
            'quizzes': QuizSubmissionSerializer(quiz_subs, many=True).data
        }
