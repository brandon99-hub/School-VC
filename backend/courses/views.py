from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import IsAdmin, IsTeacher
from core.serializers import StudentSerializer  # Updated to StudentSerializer
from .models import (
    Assignment,
    AssignmentSubmission,
    Attendance,
    Quiz,
    QuizSubmission,
    Course,
    Module,
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
from students.models import Student
from teachers.models import Teacher
from cbc.models import LearningArea, CompetencyAssessment
from datetime import datetime, timedelta
from .serializers import (
    AssignmentSerializer,
    AssignmentSubmissionSerializer,
    AttendanceSerializer,
    CourseDetailSerializer,
    CourseSerializer,
    DiscussionCommentSerializer,
    DiscussionThreadSerializer,
    GradeSerializer,
    LessonContentSerializer,
    LessonSerializer,
    ModuleSerializer,
    QuizResponseSerializer,
    QuizSerializer,
    QuizSubmissionSerializer,
    ScheduleSerializer,
)
from rest_framework import serializers

def is_admin_or_teacher(user):
    return user.is_superuser or hasattr(user, 'teacher')

@login_required
def course_list(request):
    query = request.GET.get('q', '')
    if hasattr(request.user, 'teacher'):
        courses = Course.objects.filter(teacher=request.user.teacher)
    elif hasattr(request.user, 'student'):
        courses = request.user.student.courses.all()
    else:
        courses = Course.objects.all()

    if query:
        courses = courses.filter(
            Q(name__icontains=query) |
            Q(code__icontains=query) |
            Q(teacher__user__first_name__icontains=query) |
            Q(teacher__user__last_name__icontains=query)
        )

    return render(request, 'courses/course_list.html', {
        'courses': courses,
        'query': query
    })

@login_required
def course_detail(request, pk):
    course = get_object_or_404(Course, pk=pk)
    if not (request.user.is_superuser or
            hasattr(request.user, 'teacher') or
            (hasattr(request.user, 'student') and course in request.user.student.courses.all())):
        messages.error(request, "You don't have permission to view this course.")
        return redirect('core:dashboard')

    context = {
        'course': course,
        'enrolled_students': course.students.all(),  # Updated to students
        'assignments': course.assignment_set.all(),
        'schedules': course.schedule_set.all()
    }
    return render(request, 'courses/course_detail.html', context)

@login_required
@user_passes_test(is_admin_or_teacher)
def course_add(request):
    if request.method == 'POST':
        teacher_id = request.POST.get('teacher')
        teacher = get_object_or_404(Teacher, id=teacher_id)

        course = Course.objects.create(
            name=request.POST['name'],
            code=request.POST['code'],
            description=request.POST['description'],
            credits=request.POST['credits'],
            teacher=teacher,
            semester=request.POST['semester'],
            start_date=request.POST['start_date'],
            end_date=request.POST['end_date']
        )

        messages.success(request, 'Course added successfully.')
        return redirect('courses:course_detail', pk=course.pk)

    teachers = Teacher.objects.all()
    return render(request, 'courses/course_form.html', {'teachers': teachers})

@login_required
@user_passes_test(is_admin_or_teacher)
def course_edit(request, pk):
    course = get_object_or_404(Course, pk=pk)
    if not (request.user.is_superuser or
            (hasattr(request.user, 'teacher') and request.user.teacher == course.teacher)):
        messages.error(request, "You don't have permission to edit this course.")
        return redirect('core:dashboard')

    if request.method == 'POST':
        course.name = request.POST.get('name', course.name)
        course.description = request.POST.get('description', course.description)
        course.credits = request.POST.get('credits', course.credits)
        course.semester = request.POST.get('semester', course.semester)
        course.start_date = request.POST.get('start_date', course.start_date)
        course.end_date = request.POST.get('end_date', course.end_date)

        if request.user.is_superuser:
            teacher_id = request.POST.get('teacher')
            if teacher_id:
                teacher = get_object_or_404(Teacher, id=teacher_id)
                course.teacher = teacher

        course.save()
        messages.success(request, 'Course updated successfully.')
        return redirect('courses:course_detail', pk=course.pk)

    teachers = Teacher.objects.all() if request.user.is_superuser else None
    return render(request, 'courses/course_form.html', {
        'course': course,
        'teachers': teachers
    })

@login_required
@user_passes_test(lambda u: u.is_superuser)
def course_delete(request, pk):
    course = get_object_or_404(Course, pk=pk)
    if request.method == 'POST':
        course.delete()
        messages.success(request, 'Course deleted successfully.')
        return redirect('courses:course_list')

    return render(request, 'courses/course_confirm_delete.html', {'course': course})

@login_required
def assignment_list(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    if not (request.user.is_superuser or
            (hasattr(request.user, 'teacher') and request.user.teacher == course.teacher) or
            (hasattr(request.user, 'student') and course in request.user.student.courses.all())):
        messages.error(request, "You don't have permission to view this course's assignments.")
        return redirect('core:dashboard')

    assignments = course.assignment_set.all()
    return render(request, 'courses/assignment_list.html', {
        'course': course,
        'assignments': assignments
    })

@login_required
def assignment_detail(request, course_id, assignment_id):
    assignment = get_object_or_404(Assignment, id=assignment_id, course_id=course_id)
    if not (request.user.is_superuser or
            (hasattr(request.user, 'teacher') and request.user.teacher == assignment.course.teacher) or
            (hasattr(request.user, 'student') and assignment.course in request.user.student.courses.all())):
        messages.error(request, "You don't have permission to view this assignment.")
        return redirect('core:dashboard')

    return render(request, 'courses/assignment_detail.html', {
        'assignment': assignment
    })

@login_required
def course_schedule(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    if not (request.user.is_superuser or
            (hasattr(request.user, 'teacher') and request.user.teacher == course.teacher) or
            (hasattr(request.user, 'student') and course in request.user.student.courses.all())):
        messages.error(request, "You don't have permission to view this course's schedule.")
        return redirect('core:dashboard')

    schedules = course.schedule_set.all()
    return render(request, 'courses/course_schedule.html', {
        'course': course,
        'schedules': schedules
    })

@login_required
@user_passes_test(is_admin_or_teacher)
def schedule_add(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    if not (request.user.is_superuser or
            (hasattr(request.user, 'teacher') and request.user.teacher == course.teacher)):
        messages.error(request, "You don't have permission to add schedule for this course.")
        return redirect('core:dashboard')

    if request.method == 'POST':
        schedule = Schedule.objects.create(
            course=course,
            day=request.POST['day'],
            start_time=request.POST['start_time'],
            end_time=request.POST['end_time'],
            room_number=request.POST['room_number']
        )

        messages.success(request, 'Schedule added successfully.')
        return redirect('courses:course_schedule', course_id=course.id)

    return render(request, 'courses/schedule_form.html', {'course': course})

@login_required
def enrolled_students(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    if not (request.user.is_superuser or
            (hasattr(request.user, 'teacher') and request.user.teacher == course.teacher)):
        messages.error(request, "You don't have permission to view enrolled students.")
        return redirect('core:dashboard')

    students = course.students.all()  # Updated to students
    return render(request, 'courses/enrolled_students.html', {
        'course': course,
        'students': students
    })

@login_required
def check_schedule_conflict(request):
    if request.method == 'POST':
        course_id = request.POST.get('course_id')
        day = request.POST.get('day')
        start_time = request.POST.get('start_time')
        end_time = request.POST.get('end_time')
        room_number = request.POST.get('room_number')

        conflicts = Schedule.objects.filter(
            day=day,
            room_number=room_number
        ).exclude(course_id=course_id)

        for schedule in conflicts:
            if (schedule.start_time <= datetime.strptime(start_time, '%H:%M').time() <= schedule.end_time or
                    schedule.start_time <= datetime.strptime(end_time, '%H:%M').time() <= schedule.end_time):
                return JsonResponse({
                    'status': 'error',
                    'message': f'Schedule conflicts with {schedule.course.name}'
                })

        return JsonResponse({
            'status': 'success',
            'message': 'No schedule conflicts found'
        })

    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    }, status=400)

@login_required
def check_enrollment_status(request):
    if request.method == 'GET':
        course_id = request.GET.get('course_id')
        student_id = request.GET.get('student_id')

        course = get_object_or_404(Course, id=course_id)
        student = get_object_or_404(Student, id=student_id)

        is_enrolled = student in course.students.all()  # Updated to students

        return JsonResponse({
            'status': 'success',
            'is_enrolled': is_enrolled
        })

    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    }, status=400)

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [IsTeacher]

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsTeacher]

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsAdmin | IsTeacher]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        from django.db import models
        # Optimize with select_related and prefetch_related to avoid N+1 queries
        queryset = Course.objects.select_related(
            'teacher',
            'teacher__user',
            'learning_area',
            'learning_area__grade_level'
        ).prefetch_related(
            'students',
            'assignment_set',
            'assignment_set__tested_outcomes',
            'assignment_set__submissions',
            'schedule_set'
        ).annotate(
            submission_count=models.Count('assignment__submissions', distinct=True)
        )
        
        grade_level = self.request.query_params.get('grade_level')
        if grade_level:
            queryset = queryset.filter(learning_area__grade_level_id=grade_level)
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def enroll(self, request, pk=None):
        course = self.get_object()
        student = request.user.student if hasattr(request.user, 'student') else None
        if student:
            course.students.add(student)  # Updated to students
            return Response({'status': 'enrolled'})
        return Response({'status': 'not a student'}, status=400)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def students(self, request, pk=None):
        course = self.get_object()
        students = course.students.all()  # Updated to students
        serializer = StudentSerializer(students, many=True)  # Updated to StudentSerializer
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def assignments(self, request, pk=None):
        course = self.get_object()
        assignments = course.assignment_set.all()
        serializer = AssignmentSerializer(assignments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def modules(self, request, pk=None):
        course = self.get_object()
        if course.learning_area:
            modules = Module.objects.filter(learning_area=course.learning_area).order_by('order')
        else:
            modules = Module.objects.none()
        serializer = ModuleSerializer(modules, many=True)
        return Response(serializer.data)


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.select_related('learning_area')
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(learning_area__assigned_courses__id=course_id)
        return queryset


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.select_related('module', 'module__learning_area')
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        module_id = self.request.query_params.get('module')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        return queryset


class LessonContentViewSet(viewsets.ModelViewSet):
    queryset = LessonContent.objects.select_related('lesson', 'lesson__module', 'lesson__module__learning_area')
    serializer_class = LessonContentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        lesson_id = self.request.query_params.get('lesson')
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        return queryset


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.select_related('lesson', 'lesson__module__learning_area', 'learning_area')
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        lesson_id = self.request.query_params.get('lesson')
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        return queryset


class QuizSubmissionViewSet(viewsets.ModelViewSet):
    queryset = QuizSubmission.objects.select_related('quiz', 'student')
    serializer_class = QuizSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        quiz_id = self.request.query_params.get('quiz')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        if not self.request.user.is_superuser and not hasattr(self.request.user, 'teacher'):
            queryset = queryset.filter(student=self.request.user)
        return queryset

    def perform_create(self, serializer):
        student = self.request.user
        quiz = serializer.validated_data['quiz']
        
        # Check attempts
        attempts_count = QuizSubmission.objects.filter(quiz=quiz, student=student).count()
        if attempts_count >= quiz.max_attempts:
            raise serializers.ValidationError(
                {"detail": f"You have already reached the maximum allowance of {quiz.max_attempts} attempts for this assessment."}
            )
            
        attempt_number = attempts_count + 1
        serializer.save(student=student, attempt_number=attempt_number)


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db import models
        # Optimize with select_related, prefetch_related, and annotations
        queryset = Assignment.objects.select_related(
            'learning_area',
            'learning_area__grade_level',
            'learning_outcome',
            'learning_outcome__sub_strand',
            'learning_outcome__sub_strand__strand'
        ).prefetch_related(
            'tested_outcomes',
            'tested_outcomes__sub_strand',
            'submissions',
            'submissions__student'
        ).annotate(
            submission_count=models.Count('submissions', distinct=True)
        )
        
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        assignment = self.get_object()
        submissions = assignment.submissions.all()
        serializer = AssignmentSubmissionSerializer(submissions, many=True)
        return Response(serializer.data)



class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.select_related('assignment', 'student')
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        assignment_id = self.request.query_params.get('assignment')
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
        if not self.request.user.is_superuser and not hasattr(self.request.user, 'teacher'):
            queryset = queryset.filter(student=self.request.user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=True, methods=['post'])
    def update_submission(self, request, pk=None):
        submission = self.get_object()
        if submission.student != request.user and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        if submission.status == 'graded':
            return Response({'error': 'Cannot update a graded submission'}, status=status.HTTP_400_BAD_REQUEST)

        text_response = request.data.get('text_response')
        file_obj = request.FILES.get('file')

        if text_response:
            submission.text_response = text_response
        
        if file_obj:
            # In a real app, you'd handle file storage correctly (S3, Cloudinary etc.)
            # For this local demo, we'll just store the name or a mock URL
            submission.file_url = f"/media/submissions/{file_obj.name}"
            # Logic to save file locally would go here if needed
            
        submission.save()
        return Response(AssignmentSubmissionSerializer(submission).data)


class DiscussionThreadViewSet(viewsets.ModelViewSet):
    queryset = DiscussionThread.objects.select_related('course', 'lesson', 'created_by')
    serializer_class = DiscussionThreadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        lesson_id = self.request.query_params.get('lesson')
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DiscussionCommentViewSet(viewsets.ModelViewSet):
    queryset = DiscussionComment.objects.select_related('thread', 'author')
    serializer_class = DiscussionCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        thread_id = self.request.query_params.get('thread')
        if thread_id:
            queryset = queryset.filter(thread_id=thread_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_detail_api(request, pk):
    from cbc.models import LearningArea
    from teachers.serializers import AssignmentSerializer as TeacherAssignmentSerializer
    
    student_user = request.user if isinstance(request.user, Student) else getattr(request.user, 'student', None)
    
    try:
        # 1. Try traditional Course first
        try:
            course = Course.objects.prefetch_related(
                'modules__lessons__contents',
                'modules__lessons__quizzes__questions',
                'discussion_threads__comments__author',
                'assignment_set__submissions',
            ).get(pk=pk)

            has_permission = False
            if request.user.is_superuser or hasattr(request.user, 'teacher'):
                has_permission = True
            elif student_user:
                has_permission = course in student_user.get_enrolled_courses()

            if not has_permission:
                return Response(
                    {"error": "You don't have permission to view this course."},
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer = CourseDetailSerializer(course)
            data = serializer.data

            schedules = course.schedule_set.all()
            data['schedules'] = [
                {
                    'id': schedule.id,
                    'day': schedule.day,
                    'start_time': schedule.start_time,
                    'end_time': schedule.end_time,
                    'meeting_link': schedule.meeting_link,
                    'recording_link': schedule.recording_link
                }
                for schedule in schedules
            ]

            if student_user:
                assignment_submissions = AssignmentSubmission.objects.filter(
                    assignment__course=course,
                    student=student_user
                )
                quiz_submissions = QuizSubmission.objects.filter(
                    quiz__lesson__module__course=course,
                    student=student_user
                )
                completed_quizzes = quiz_submissions.values('quiz_id').distinct().count()
                published_lessons = Lesson.objects.filter(module__course=course, is_published=True).count()

                data['student_submissions'] = {
                    'assignments': AssignmentSubmissionSerializer(assignment_submissions, many=True).data,
                    'quizzes': QuizSubmissionSerializer(quiz_submissions, many=True).data,
                }
                data['student_progress'] = {
                    'completed_quizzes': completed_quizzes,
                    'attempted_quizzes': quiz_submissions.count(),
                    'published_lessons': published_lessons,
                }

            return Response(data)

        except Course.DoesNotExist:
            # 2. Fallback to CBC LearningArea
            area = LearningArea.objects.prefetch_related(
                'strands__sub_strands__learning_outcomes',
                'assignments',
                'students'
            ).get(pk=pk)

            has_permission = False
            if request.user.is_superuser or hasattr(request.user, 'teacher'):
                has_permission = True
            else:
                has_permission = area.students.filter(id=request.user.id).exists()

            if not has_permission:
                return Response(
                    {"error": "You don't have permission to view this Learning Area."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Get all quizzes for this learning area
            quizzes_qs = Quiz.objects.filter(learning_area=area, is_published=True)
            quizzes_data = QuizSerializer(quizzes_qs, many=True).data

            # Map LearningArea to CourseDetail expected structure
            data = {
                'id': area.id,
                'name': area.name,
                'code': area.code,
                'description': area.description,
                'teacher_name': area.teacher.user.get_full_name() if area.teacher else "Departmental Teacher",
                'grade_level_name': area.grade_level.name,
                'is_active': area.is_active,
                'modules': [],
                'assignments': TeacherAssignmentSerializer(area.assignments.all(), many=True).data,
                'quizzes': quizzes_data,
                'schedules': [], # CBC schedule handled differently or TBD
                'discussion_threads': [],
                'assignment_submissions': [], 
                'quiz_submissions': [],
                'student_progress': {'completed_quizzes': 0, 'attempted_quizzes': 0, 'published_lessons': 0},
                'learning_summary': {
                    'total_lessons': 0,
                    'published_lessons': 0,
                    'quiz_count': quizzes_qs.count()
                }
            }

            # Map Strands -> Modules and Sub-strands -> Lessons
            total_lessons = 0
            for strand in area.strands.all().order_by('order'):
                module = {
                    'id': strand.id,
                    'title': strand.name,
                    'description': strand.description,
                    'order': strand.order,
                    'lessons': []
                }
                
                for sub in strand.sub_strands.all().order_by('order'):
                    total_lessons += 1
                    
                    # Try to find a real Lesson object matching this sub-strand
                    real_lesson = Lesson.objects.filter(
                        module__learning_area=area,
                        title=sub.name
                    ).first()
                    
                    from teachers.lesson_serializers import LessonContentSerializer
                    teacher_contents = []
                    if real_lesson:
                        teacher_contents = LessonContentSerializer(real_lesson.contents.all(), many=True).data

                    lesson = {
                        'id': sub.id,
                        'title': sub.name,
                        'summary': sub.description,
                        'order': sub.order,
                        'teacher_contents': teacher_contents,
                        'content_count': len(teacher_contents),
                        'outcomes_count': sub.learning_outcomes.count(),
                        'learning_outcomes': [
                            {
                                'id': outcome.id,
                                'title': outcome.code,
                                'body': outcome.description,
                                'content_type': 'outcome'
                            }
                            for outcome in sub.learning_outcomes.all().order_by('order')
                        ],
                        'quizzes': QuizSerializer(Quiz.objects.filter(lesson_id=None, learning_area=area, learning_outcome__sub_strand=sub, is_published=True), many=True).data
                    }
                    module['lessons'].append(lesson)
                
                data['modules'].append(module)

            data['learning_summary']['total_lessons'] = total_lessons
            data['learning_summary']['published_lessons'] = total_lessons # CBC registry assumed published
            
            # Fetch user submissions for this learning area
            if not request.user.is_superuser and not hasattr(request.user, 'teacher'):
                from .serializers import AssignmentSubmissionSerializer, QuizSubmissionSerializer
                from .models import AssignmentSubmission, QuizSubmission
                
                sub_data = AssignmentSubmission.objects.filter(
                    assignment__learning_area=area,
                    student=request.user
                )
                data['assignment_submissions'] = AssignmentSubmissionSerializer(sub_data, many=True).data
                
                quiz_subs = QuizSubmission.objects.filter(
                    quiz__learning_area=area,
                    student=request.user
                ) if not area.assigned_courses.exists() else QuizSubmission.objects.filter(
                    quiz__lesson__module__learning_area=area,
                    student=request.user
                )
                
                # Consolidate quiz submissions
                all_quiz_subs = quiz_subs | QuizSubmission.objects.filter(quiz__learning_area=area, student=request.user)
                all_quiz_subs = all_quiz_subs.distinct()

                data['quiz_submissions'] = QuizSubmissionSerializer(all_quiz_subs, many=True).data
                data['student_submissions'] = {
                    'assignments': data['assignment_submissions'],
                    'quizzes': data['quiz_submissions']
                }

                # Update progress
                data['student_progress'] = {
                    'completed_quizzes': all_quiz_subs.filter(status__in=['graded', 'auto_graded']).values('quiz_id').distinct().count(),
                    'attempted_quizzes': all_quiz_subs.values('quiz_id').distinct().count(),
                    'published_lessons': total_lessons,
                }

            return Response(data)

    except (Course.DoesNotExist, LearningArea.DoesNotExist):
        return Response(
            {"error": "Learning Area not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"An unexpected error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_students_api(request, pk):
    """Get list of students enrolled in a course"""
    try:
        course = Course.objects.get(pk=pk)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)
    
    # Check if user is teacher of this course or admin
    if not (request.user.is_superuser or 
            (hasattr(request.user, 'teacher') and course.teacher == request.user.teacher)):
        return Response({'error': 'Permission denied'}, status=403)
    
    students = course.enrolled_students.all()
    data = [
        {
            'id': s.id,
            'name': f"{s.first_name} {s.last_name}".strip(),
            'email': s.email,
            'student_id': s.student_id
        }
        for s in students
    ]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_grade_api(request):
    """Submit a grade for a student assignment"""
    student_id = request.data.get('student')
    assignment_id = request.data.get('assignment')
    score = request.data.get('score')
    
    if not all([student_id, assignment_id, score]):
        return Response({'error': 'Missing required fields'}, status=400)
    
    try:
        assignment = Assignment.objects.get(pk=assignment_id)
        student = Student.objects.get(pk=student_id)
    except (Assignment.DoesNotExist, Student.DoesNotExist):
        return Response({'error': 'Invalid assignment or student'}, status=404)
    
    # Check permission
    if not (request.user.is_superuser or 
            (hasattr(request.user, 'teacher') and assignment.course.teacher == request.user.teacher)):
        return Response({'error': 'Permission denied'}, status=403)
    
    grade, created = Grade.objects.update_or_create(
        student=student,
        assignment=assignment,
        defaults={'score': score}
    )
    
    return Response({
        'success': True,
        'grade_id': grade.id,
        'created': created
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_gradebook_api(request, pk):
    """Get complete gradebook for a course or learning area with all students and their grades"""
    course = None
    learning_area = None
    
    # Try finding as LearningArea first (CBC subjects)
    try:
        learning_area = LearningArea.objects.get(pk=pk)
    except LearningArea.DoesNotExist:
        # Try finding as Course (8-4-4 legacy)
        try:
            course = Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return Response({'error': 'Subject or Course not found'}, status=404)
    
    # Permission check - only teacher of course/area or admin
    is_teacher = False
    if hasattr(request.user, 'teacher'):
        if learning_area:
            is_teacher = (learning_area.teacher == request.user.teacher)
        elif course:
            is_teacher = (course.teacher == request.user.teacher)
            
    if not (request.user.is_superuser or is_teacher):
        return Response({'error': 'Permission denied'}, status=403)
    
    # Resolve data sources
    if learning_area:
        students = learning_area.students.all()
        assignments = learning_area.assignments.all().order_by('due_date')
        quizzes = Quiz.objects.filter(learning_area=learning_area).order_by('id')
    else:
        students = course.students.all()
        # For legacy courses, we might have assignments linked to either the course or its learning area
        assignments = course.assignment_set.all().order_by('due_date')
        quizzes = Quiz.objects.filter(learning_area=course.learning_area).order_by('id') if course.learning_area else Quiz.objects.none()
    
    gradebook = []
    for student in students:
        student_data = {
            'student_id': student.id,
            'student_name': student.get_full_name(),
            'email': student.email,
            'student_number': student.student_id,
            'grades': {},
            'quiz_grades': {}
        }
        
        # Assignment Grades
        for assignment in assignments:
            try:
                # Try to find a traditional numerical grade first
                grade = Grade.objects.get(student=student, assignment=assignment)
                student_data['grades'][str(assignment.id)] = {
                    'score': float(grade.score),
                    'letter_grade': grade.letter_grade or '',
                    'grade_id': grade.id
                }
            except Grade.DoesNotExist:
                # Fallback for CBC: Check if there's a competency assessment for this outcome
                if assignment.learning_outcome:
                    assessment = CompetencyAssessment.objects.filter(
                        student=student,
                        learning_outcome=assignment.learning_outcome
                    ).order_by('-assessment_date').first()
                    
                    if assessment:
                        student_data['grades'][str(assignment.id)] = {
                            'score': 0, # CBC uses labels not numerical scores in this view
                            'letter_grade': assessment.competency_level,
                            'grade_id': assessment.id
                        }
                    else:
                        student_data['grades'][str(assignment.id)] = None
                else:
                    student_data['grades'][str(assignment.id)] = None
        
        # Quiz Grades (Highest score per quiz)
        for quiz in quizzes:
            submission = QuizSubmission.objects.filter(
                student=student, 
                quiz=quiz, 
                status__in=['graded', 'auto_graded']
            ).order_by('-score').first()
            
            if submission:
                student_data['quiz_grades'][str(quiz.id)] = {
                    'score': float(submission.score or 0),
                    'total': float(quiz.total_points),
                    'status': submission.status,
                    'submission_id': submission.id,
                    'competency_level': submission.get_competency_level()
                }
            else:
                student_data['quiz_grades'][str(quiz.id)] = None
        
        gradebook.append(student_data)
    
    return Response({
        'students': gradebook,
        'assignments': AssignmentSerializer(assignments, many=True).data,
        'quizzes': QuizSerializer(quizzes, many=True).data
    })

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_grade_api(request, grade_id):
    """Update an existing grade"""
    try:
        grade = Grade.objects.get(pk=grade_id)
    except Grade.DoesNotExist:
        return Response({'error': 'Grade not found'}, status=404)
    
    # Permission check
    if not (request.user.is_superuser or 
            (hasattr(request.user, 'teacher') and grade.course.teacher == request.user.teacher)):
        return Response({'error': 'Permission denied'}, status=403)
    
    score = request.data.get('score')
    letter_grade = request.data.get('letter_grade', '')
    
    if score is not None:
        grade.score = score
    if letter_grade:
        grade.letter_grade = letter_grade
    
    grade.save()
    
    return Response({
        'success': True,
        'grade_id': grade.id,
        'score': float(grade.score),
        'letter_grade': grade.letter_grade
    })
