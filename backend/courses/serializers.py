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
    tested_outcomes_detail = serializers.SerializerMethodField()
    teacher = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'due_date', 'total_marks', 'status',
            'learning_area', 'learning_area_name', 'learning_outcome', 
            'learning_outcome_description', 'learning_outcome_code',
            'strand_name', 'sub_strand_name', 'strand_id', 'sub_strand_id',
            'is_cbc_assignment', 'assessment_type', 'tested_outcomes', 
            'tested_outcomes_detail', 'teacher', 'submission_count', 'created_at'
        ]
    
    def get_teacher(self, obj):
        return obj.teacher_id
    
    def get_submission_count(self, obj):
        """Get the number of submissions for this assignment"""
        return obj.submissions.count()

    def get_tested_outcomes_detail(self, obj):
        from cbc.serializers import LearningOutcomeListSerializer
        outcomes = obj.tested_outcomes.all()
        return LearningOutcomeListSerializer(outcomes, many=True).data



class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    # CBC fields
    is_cbc_graded = serializers.BooleanField(read_only=True)
    competency_level_display = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'student', 'submitted_at', 'file', 'file_url', 
            'text_response', 'status', 'feedback', 'grade', 'competency_level', 
            'competency_comment', 'student_name', 'student_id', 'assignment_title',
            'is_cbc_graded', 'competency_level_display'
        ]
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
        fields = ['question', 'response', 'is_correct', 'feedback']
        read_only_fields = ['is_correct', 'feedback']


class QuizQuestionSerializer(serializers.ModelSerializer):
    """Serializer for quiz questions"""
    class Meta:
        model = QuizQuestion
        fields = ['id', 'quiz', 'prompt', 'question_type', 'choices', 'correct_answer', 'points', 'order']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    tested_outcomes_detail = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'lesson', 'title', 'instructions', 'time_limit_minutes', 
            'max_attempts', 'is_published', 'due_date', 'learning_area', 'learning_outcome', 
            'tested_outcomes', 'tested_outcomes_detail', 'questions', 'total_points', 'created_at'
        ]
    
    def get_tested_outcomes_detail(self, obj):
        from cbc.serializers import LearningOutcomeListSerializer
        outcomes = obj.tested_outcomes.all()
        return LearningOutcomeListSerializer(outcomes, many=True).data


class QuizSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    quiz_total_points = serializers.IntegerField(source='quiz.total_points', read_only=True)
    responses = QuizResponseSerializer(many=True, required=False)
    competency_level = serializers.SerializerMethodField()

    class Meta:
        model = QuizSubmission
        fields = ['id', 'quiz', 'student', 'attempt_number', 'score', 'submitted_at', 'status', 'feedback', 'responses', 'competency_level', 'student_name', 'student_id', 'quiz_title', 'quiz_total_points']
        read_only_fields = ('student', 'attempt_number', 'score', 'status')

    def create(self, validated_data):
        responses_data = validated_data.pop('responses', [])
        submission = QuizSubmission.objects.create(**validated_data)
        
        score = 0
        for resp in responses_data:
            question = resp['question']
            student_answer = resp['response']
            
            is_correct = False
            
            # Resolve correct answer (could be index or choice text)
            correct_val = question.correct_answer
            choices = question.choices # List of strings from JSON
            
            if isinstance(correct_val, (int, str)) and choices:
                try:
                    idx = int(correct_val)
                    if 0 <= idx < len(choices):
                        correct_val = choices[idx]
                except (ValueError, TypeError):
                    pass
            
            # Robust comparison: normalize both answers
            def normalize(val):
                if val is None: return ""
                if isinstance(val, (list, dict)):
                    import json
                    return json.dumps(val, sort_keys=True).strip().lower()
                return str(val).strip().lower()
            
            if normalize(student_answer) == normalize(correct_val):
                is_correct = True
                score += question.points
                
            QuizResponse.objects.create(
                submission=submission,
                question=question,
                response=student_answer,
                is_correct=is_correct
            )
            
        submission.score = score
        submission.status = 'auto_graded'
        submission.save()
        return submission

    def get_competency_level(self, obj):
        if obj.score is None:
            return None
        
        quiz = obj.quiz
        total = quiz.total_points
        if total == 0:
            return None
            
        percentage = (float(obj.score) / float(total)) * 100
        
        if percentage >= 80:
            return 'EE'
        elif percentage >= 60:
            return 'ME'
        elif percentage >= 40:
            return 'AE'
        else:
            return 'BE'


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
    quizzes = serializers.SerializerMethodField()
    discussion_threads = serializers.SerializerMethodField()
    student_submissions = serializers.SerializerMethodField()
    assignment_submissions = serializers.SerializerMethodField()
    quiz_submissions = serializers.SerializerMethodField()
    learning_summary = serializers.SerializerMethodField()

    class Meta(CourseSerializer.Meta):
        fields = '__all__'

    def get_quizzes(self, obj):
        if obj.learning_area:
            quizzes = Quiz.objects.filter(lesson__module__learning_area=obj.learning_area, is_published=True)
        else:
            quizzes = Quiz.objects.none()
        return QuizSerializer(quizzes, many=True).data

    def get_discussion_threads(self, obj):
        threads = obj.discussion_threads.prefetch_related('comments__author')
        return DiscussionThreadSerializer(threads, many=True).data

    def get_assignment_submissions(self, obj):
        request = self.context.get('request')
        student = getattr(request.user, 'student', None) if request else None
        submissions = AssignmentSubmission.objects.filter(assignment__course=obj)
        if student:
            submissions = submissions.filter(student=student)
        return AssignmentSubmissionSerializer(submissions, many=True).data

    def get_quiz_submissions(self, obj):
        request = self.context.get('request')
        student = getattr(request.user, 'student', None) if request else None
        if obj.learning_area:
            submissions = QuizSubmission.objects.filter(quiz__lesson__module__learning_area=obj.learning_area)
        else:
            submissions = QuizSubmission.objects.none()
        if student:
            submissions = submissions.filter(student=student)
        return QuizSubmissionSerializer(submissions, many=True).data

    def get_student_submissions(self, obj):
        return {
            'assignments': self.get_assignment_submissions(obj),
            'quizzes': self.get_quiz_submissions(obj)
        }

    def get_learning_summary(self, obj):
        if not obj.learning_area:
            return {
                'total_lessons': 0,
                'published_lessons': 0,
                'published_percentage': 0,
                'quiz_count': 0,
            }
        lessons = Lesson.objects.filter(module__learning_area=obj.learning_area)
        lesson_count = lessons.count()
        published_lessons = lessons.filter(is_published=True).count()
        quiz_count = Quiz.objects.filter(lesson__module__learning_area=obj.learning_area, is_published=True).count()
        return {
            'total_lessons': lesson_count,
            'published_lessons': published_lessons,
            'published_percentage': (published_lessons / lesson_count * 100) if lesson_count else 0,
            'quiz_count': quiz_count,
        }