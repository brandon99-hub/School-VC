from rest_framework import serializers

from students.models import Student
from teachers.models import Teacher

from .models import (
    Assignment,
    AssignmentSubmission,
    Attendance,
    Course,
    DiscussionComment,
    DiscussionThread,
    Grade,
    Lesson,
    LessonContent,
    Module,
    Quiz,
    QuizQuestion,
    QuizResponse,
    QuizSubmission,
    Schedule,
)

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'
        extra_fields = ['course_name', 'course_code']

class AssignmentSerializer(serializers.ModelSerializer):
    submission_count = serializers.SerializerMethodField()
    # CBC fields
    learning_area_name = serializers.CharField(source='learning_area.name', read_only=True)
    learning_outcome_description = serializers.CharField(source='learning_outcome.description', read_only=True)
    learning_outcome_code = serializers.CharField(source='learning_outcome.code', read_only=True)
    strand_name = serializers.CharField(source='learning_outcome.sub_strand.strand.name', read_only=True)
    sub_strand_name = serializers.CharField(source='learning_outcome.sub_strand.name', read_only=True)
    strand_id = serializers.IntegerField(source='learning_outcome.sub_strand.strand.id', read_only=True)
    sub_strand_id = serializers.IntegerField(source='learning_outcome.sub_strand.id', read_only=True)
    is_cbc_assignment = serializers.BooleanField(source='is_cbc', read_only=True)
    
    class Meta:
        model = Assignment
        fields = '__all__'
    
    def get_submission_count(self, obj):
        """Get the number of submissions for this assignment"""
        return obj.submissions.count()



class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    # CBC fields
    is_cbc_graded = serializers.BooleanField(read_only=True)
    competency_level_display = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentSubmission
        fields = '__all__'
        read_only_fields = ('student',)
    
    def get_competency_level_display(self, obj):
        """Get full display name for competency level"""
        if obj.competency_level:
            return dict(AssignmentSubmission.COMPETENCY_LEVELS).get(obj.competency_level)
        return None


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = '__all__'


class LessonContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonContent
        fields = '__all__'


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = '__all__'


class QuizResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizResponse
        fields = '__all__'


class QuizQuestionSerializer(serializers.ModelSerializer):
    """Serializer for quiz questions"""
    class Meta:
        model = QuizQuestion
        fields = ['id', 'quiz', 'prompt', 'question_type', 'choices', 'correct_answer', 'points', 'order']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = '__all__'


class QuizSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    responses = QuizResponseSerializer(many=True, read_only=True)

    class Meta:
        model = QuizSubmission
        fields = '__all__'
        read_only_fields = ('student', 'attempt_number', 'score', 'status')


class LessonSerializer(serializers.ModelSerializer):
    contents = LessonContentSerializer(many=True, read_only=True)
    quizzes = QuizSerializer(many=True, read_only=True)

    class Meta:
        model = Lesson
        fields = '__all__'


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = '__all__'


class DiscussionCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = DiscussionComment
        fields = '__all__'
        read_only_fields = ('author',)


class DiscussionThreadSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    comments = DiscussionCommentSerializer(many=True, read_only=True)

    class Meta:
        model = DiscussionThread
        fields = '__all__'
        read_only_fields = ('created_by',)


class CourseSerializer(serializers.ModelSerializer):
    assignments = AssignmentSerializer(many=True, read_only=True)
    schedules = ScheduleSerializer(many=True, read_only=True)
    teacher = serializers.PrimaryKeyRelatedField(queryset=Teacher.objects.all())
    enrolled_students = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Student.objects.all(), source='students'
    )
    enrolled_students_count = serializers.IntegerField(source='students.count', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)

    class Meta:
        model = Course
        fields = '__all__'
        extra_fields = ['enrolled_students_count', 'teacher_name']


class CourseDetailSerializer(CourseSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    assignments = AssignmentSerializer(many=True, read_only=True, source='assignment_set')
    discussion_threads = serializers.SerializerMethodField()
    assignment_submissions = serializers.SerializerMethodField()
    quiz_submissions = serializers.SerializerMethodField()
    learning_summary = serializers.SerializerMethodField()

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields

    def get_discussion_threads(self, obj):
        threads = obj.discussion_threads.prefetch_related('comments__author')
        return DiscussionThreadSerializer(threads, many=True).data

    def get_assignment_submissions(self, obj):
        request = self.context.get('request')
        submissions = AssignmentSubmission.objects.filter(assignment__course=obj).select_related('student')
        if request and hasattr(request.user, 'student'):
            submissions = submissions.filter(student=request.user.student)
        return AssignmentSubmissionSerializer(submissions, many=True).data

    def get_quiz_submissions(self, obj):
        request = self.context.get('request')
        submissions = QuizSubmission.objects.filter(quiz__lesson__module__course=obj).select_related('student')
        if request and hasattr(request.user, 'student'):
            submissions = submissions.filter(student=request.user.student)
        return QuizSubmissionSerializer(submissions, many=True).data

    def get_learning_summary(self, obj):
        lesson_count = Lesson.objects.filter(module__course=obj).count()
        published_lessons = Lesson.objects.filter(module__course=obj, is_published=True).count()
        quiz_count = Quiz.objects.filter(lesson__module__course=obj, is_published=True).count()
        return {
            'total_lessons': lesson_count,
            'published_lessons': published_lessons,
            'published_percentage': (published_lessons / lesson_count * 100) if lesson_count else 0,
            'quiz_count': quiz_count,
        }