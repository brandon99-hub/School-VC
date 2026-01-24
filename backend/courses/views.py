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
from students.models import Student
from teachers.models import Teacher
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
)

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
        queryset = Course.objects.all()
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
        modules = course.module_set.all().order_by('order')
        serializer = ModuleSerializer(modules, many=True)
        return Response(serializer.data)


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.select_related('course')
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.select_related('module', 'module__course')
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        module_id = self.request.query_params.get('module')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        return queryset


class LessonContentViewSet(viewsets.ModelViewSet):
    queryset = LessonContent.objects.select_related('lesson', 'lesson__module')
    serializer_class = LessonContentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        lesson_id = self.request.query_params.get('lesson')
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        return queryset


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.select_related('lesson', 'lesson__module__course')
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
        attempt_number = (
            QuizSubmission.objects.filter(quiz=quiz, student=student).count() + 1
        )
        serializer.save(student=student, attempt_number=attempt_number)


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
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
                'schedules': [], # CBC schedule handled differently or TBD
                'discussion_threads': [],
                'student_submissions': {'assignments': [], 'quizzes': []},
                'student_progress': {'completed_quizzes': 0, 'attempted_quizzes': 0, 'published_lessons': 0},
                'learning_summary': {
                    'total_lessons': 0,
                    'published_lessons': 0,
                    'quiz_count': 0
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
                    lesson = {
                        'id': sub.id,
                        'title': sub.name,
                        'summary': sub.description,
                        'order': sub.order,
                        'duration_minutes': 40, # Default CBC period
                        'contents': [
                            {
                                'id': outcome.id,
                                'title': outcome.code,
                                'body': outcome.description,
                                'content_type': 'document'
                            }
                            for outcome in sub.learning_outcomes.all().order_by('order')
                        ],
                        'quizzes': []
                    }
                    module['lessons'].append(lesson)
                
                data['modules'].append(module)

            data['learning_summary']['total_lessons'] = total_lessons
            data['learning_summary']['published_lessons'] = total_lessons # CBC registry assumed published
            
            # Fetch user submissions for this learning area
            if not request.user.is_superuser and not hasattr(request.user, 'teacher'):
                sub_data = AssignmentSubmission.objects.filter(
                    assignment__learning_area=area,
                    student=request.user
                )
                data['student_submissions']['assignments'] = AssignmentSubmissionSerializer(sub_data, many=True).data

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
    """Get complete gradebook for a course with all students and their grades"""
    try:
        course = Course.objects.get(pk=pk)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)
    
    # Permission check - only teacher of course or admin
    if not (request.user.is_superuser or 
            (hasattr(request.user, 'teacher') and course.teacher == request.user.teacher)):
        return Response({'error': 'Permission denied'}, status=403)
    
    students = course.students.all()
    assignments = course.assignment_set.all().order_by('due_date')
    
    gradebook = []
    for student in students:
        student_data = {
            'student_id': student.id,
            'student_name': student.get_full_name(),
            'email': student.email,
            'student_number': student.student_id,
            'grades': {}
        }
        
        for assignment in assignments:
            try:
                grade = Grade.objects.get(student=student, assignment=assignment)
                student_data['grades'][str(assignment.id)] = {
                    'score': float(grade.score),
                    'letter_grade': grade.letter_grade or '',
                    'grade_id': grade.id
                }
            except Grade.DoesNotExist:
                student_data['grades'][str(assignment.id)] = None
        
        gradebook.append(student_data)
    
    return Response({
        'students': gradebook,
        'assignments': AssignmentSerializer(assignments, many=True).data
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
