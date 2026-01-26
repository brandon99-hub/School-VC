from django.shortcuts import render
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Q
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Teacher, TeacherAttendance
from courses.models import Course, Assignment, Schedule, Quiz, QuizSubmission, AssignmentSubmission
from students.models import Student, Attendance
from django.contrib.auth.models import User
from datetime import datetime, timedelta
from .serializers import CourseSerializer


def is_admin(user):
    return user.is_superuser


@login_required
def teacher_list(request):
    query = request.GET.get('q', '')
    teachers = Teacher.objects.all()

    if query:
        teachers = teachers.filter(
            Q(user__first_name__icontains=query) |
            Q(user__last_name__icontains=query) |
            Q(teacher_id__icontains=query) |
            Q(specialization__icontains=query)
        )

    return render(request, 'teachers/teacher_list.html', {
        'teachers': teachers,
        'query': query
    })


@login_required
def teacher_detail(request, pk):
    teacher = get_object_or_404(Teacher, pk=pk)
    if not (request.user.is_superuser or request.user == teacher.user):
        messages.error(request, "You don't have permission to view this profile.")
        return redirect('core:dashboard')

    context = {
        'teacher': teacher,
        'assigned_courses': teacher.course_set.all(),
        'total_students': sum(course.enrolled_students.count() for course in teacher.course_set.all()),
        'attendance_records': teacher.teacherattendance_set.all()[:10]
    }
    return render(request, 'teachers/teacher_detail.html', context)


@login_required
@user_passes_test(is_admin)
def teacher_add(request):
    if request.method == 'POST':
        # Create user account
        user = User.objects.create_user(
            username=request.POST['username'],
            password=request.POST['password'],
            first_name=request.POST['first_name'],
            last_name=request.POST['last_name'],
            email=request.POST['email']
        )

        # Create teacher profile
        teacher = Teacher.objects.create(
            user=user,
            teacher_id=request.POST['teacher_id'],
            date_of_birth=request.POST['date_of_birth'],
            qualification=request.POST['qualification'],
            specialization=request.POST['specialization'],
            experience_years=request.POST['experience_years'],
            address=request.POST['address'],
            phone=request.POST['phone']
        )

        messages.success(request, 'Teacher added successfully.')
        return redirect('teachers:teacher_detail', pk=teacher.pk)

    return render(request, 'teachers/teacher_form.html')


@login_required
def teacher_edit(request, pk):
    teacher = get_object_or_404(Teacher, pk=pk)
    if not (request.user.is_superuser or request.user == teacher.user):
        messages.error(request, "You don't have permission to edit this profile.")
        return redirect('core:dashboard')

    if request.method == 'POST':
        # Update user information
        user = teacher.user
        if request.user.is_superuser:  # Only admin can update these fields
            user.first_name = request.POST.get('first_name', user.first_name)
            user.last_name = request.POST.get('last_name', user.last_name)
            user.email = request.POST.get('email', user.email)
        user.save()

        # Update teacher information
        teacher.qualification = request.POST.get('qualification', teacher.qualification)
        teacher.specialization = request.POST.get('specialization', teacher.specialization)
        teacher.experience_years = request.POST.get('experience_years', teacher.experience_years)
        teacher.address = request.POST.get('address', teacher.address)
        teacher.phone = request.POST.get('phone', teacher.phone)
        teacher.save()

        messages.success(request, 'Profile updated successfully.')
        return redirect('teachers:teacher_detail', pk=teacher.pk)

    return render(request, 'teachers/teacher_form.html', {'teacher': teacher})


@login_required
@user_passes_test(is_admin)
def teacher_delete(request, pk):
    teacher = get_object_or_404(Teacher, pk=pk)
    if request.method == 'POST':
        user = teacher.user
        teacher.delete()
        user.delete()
        messages.success(request, 'Teacher deleted successfully.')
        return redirect('teachers:teacher_list')

    return render(request, 'teachers/teacher_confirm_delete.html', {'teacher': teacher})


@login_required
def assigned_courses(request):
    if hasattr(request.user, 'teacher'):
        courses = request.user.teacher.course_set.all()
        return render(request, 'teachers/assigned_courses.html', {'courses': courses})
    messages.error(request, 'Only teachers can access this page.')
    return redirect('core:dashboard')


@login_required
def course_detail(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    if not (request.user.is_superuser or
            (hasattr(request.user, 'teacher') and request.user.teacher == course.teacher)):
        messages.error(request, "You don't have permission to view this course.")
        return redirect('core:dashboard')

    context = {
        'course': course,
        'enrolled_students': course.enrolled_students.all(),
        'assignments': course.assignment_set.all(),
        'schedules': course.schedule_set.all()
    }
    return render(request, 'teachers/course_detail.html', context)


@login_required
def course_students(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    if not (request.user.is_superuser or
            (hasattr(request.user, 'teacher') and request.user.teacher == course.teacher)):
        messages.error(request, "You don't have permission to view this course's students.")
        return redirect('core:dashboard')

    students = course.enrolled_students.all()
    return render(request, 'teachers/course_students.html', {
        'course': course,
        'students': students
    })


@login_required
def mark_student_attendance(request):
    if not (request.user.is_superuser or hasattr(request.user, 'teacher')):
        return JsonResponse({
            'status': 'error',
            'message': 'Permission denied'
        }, status=403)

    if request.method == 'POST':
        student_id = request.POST.get('student_id')
        date = request.POST.get('date')
        status = request.POST.get('status')

        student = get_object_or_404(Student, id=student_id)
        attendance, created = Attendance.objects.update_or_create(
            student=student,
            date=date,
            defaults={'status': status}
        )

        return JsonResponse({
            'status': 'success',
            'message': 'Attendance marked successfully'
        })

    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    }, status=400)


@login_required
def teacher_schedule(request):
    if not hasattr(request.user, 'teacher'):
        messages.error(request, 'Only teachers can view their schedule.')
        return redirect('core:dashboard')

    teacher = request.user.teacher
    schedules = Schedule.objects.filter(course__teacher=teacher)

    return render(request, 'teachers/schedule.html', {
        'schedules': schedules
    })


@login_required
def assignment_list(request):
    if not hasattr(request.user, 'teacher'):
        messages.error(request, 'Only teachers can view assignments.')
        return redirect('core:dashboard')

    teacher = request.user.teacher
    assignments = Assignment.objects.filter(course__teacher=teacher)

    return render(request, 'teachers/assignment_list.html', {
        'assignments': assignments
    })


@login_required
def create_assignment(request):
    if not hasattr(request.user, 'teacher'):
        messages.error(request, 'Only teachers can create assignments.')
        return redirect('core:dashboard')

    if request.method == 'POST':
        course_id = request.POST.get('course')
        course = get_object_or_404(Course, id=course_id, teacher=request.user.teacher)

        assignment = Assignment.objects.create(
            course=course,
            title=request.POST['title'],
            description=request.POST['description'],
            due_date=request.POST['due_date'],
            total_marks=request.POST['total_marks']
        )

        messages.success(request, 'Assignment created successfully.')
        return redirect('teachers:assignment_detail', assignment_id=assignment.id)

    courses = request.user.teacher.course_set.all()
    return render(request, 'teachers/assignment_form.html', {
        'courses': courses
    })


@login_required
def update_assignment_status(request):
    if request.method == 'POST':
        assignment_id = request.POST.get('assignment_id')
        new_status = request.POST.get('status')

        assignment = get_object_or_404(Assignment, id=assignment_id)
        if not (request.user.is_superuser or
                (hasattr(request.user, 'teacher') and request.user.teacher == assignment.course.teacher)):
            return JsonResponse({
                'status': 'error',
                'message': 'Permission denied'
            }, status=403)

        assignment.status = new_status
        assignment.save()

        return JsonResponse({
            'status': 'success',
            'message': 'Assignment status updated successfully'
        })

    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    }, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def assigned_courses_api(request):
    """DRF API endpoint for teacher's assigned subjects (Learning Areas in CBC)"""
    if not hasattr(request.user, 'teacher'):
        return Response({'error': 'Forbidden'}, status=403)

    from .serializers import LearningAreaSerializer
    from cbc.models import LearningArea
    
    # Get CBC Learning Areas assigned to this teacher
    learning_areas = LearningArea.objects.filter(teacher=request.user.teacher, is_active=True)
    serializer = LearningAreaSerializer(learning_areas, many=True)
    
    # Calculate unique student count across all assigned learning areas
    unique_students = Student.objects.filter(
        learning_areas__teacher=request.user.teacher
    ).distinct().count()

    # Get Pending Actions (Recent activity)
    pending_actions = []
    
    # 1. Un-graded Assignment Submissions
    ungraded_submissions = AssignmentSubmission.objects.filter(
        assignment__learning_area__teacher=request.user.teacher,
        status__iexact='submitted'
    ).order_by('-submitted_at')[:5]
    
    for sub in ungraded_submissions:
        pending_actions.append({
            'id': f"sub_{sub.id}",
            'type': 'assignment',
            'title': sub.assignment.title,
            'student_name': sub.student.get_full_name(),
            'submitted_at': sub.submitted_at,
            'assignment_id': sub.assignment.id,
            'learning_area_id': sub.assignment.learning_area_id
        })
        
    # 2. Recent Quiz Results (Auto-graded)
    recent_quizzes = QuizSubmission.objects.filter(
        quiz__learning_area__teacher=request.user.teacher,
        status__in=['auto_graded', 'graded']
    ).order_by('-submitted_at')[:5]
    
    for q in recent_quizzes:
        pending_actions.append({
            'id': f"quiz_{q.id}",
            'type': 'quiz_result',
            'title': q.quiz.title,
            'student_name': q.student.get_full_name(),
            'score': float(q.score or 0),
            'total': float(q.quiz.total_points or 100), # Use total_points property from Quiz model
            'submitted_at': q.submitted_at
        })

    # Sort all by most recent
    pending_actions.sort(key=lambda x: x['submitted_at'], reverse=True)
    
    return Response({
        'courses': serializer.data,
        'unique_student_count': unique_students,
        'pending_actions': pending_actions[:5]
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_detail_api(request, course_id):
    """DRF API endpoint for learning area detail (replaces course detail)"""
    # In the new CBC-first architecture, teacher "courses" are LearningArea objects.
    from cbc.models import LearningArea
    area = get_object_or_404(LearningArea, id=course_id)
    
    # Check permission: Teacher must be assigned to this area or be superuser
    if not (request.user.is_superuser or area.teacher == request.user.teacher):
        return Response({'error': 'Permission denied'}, status=403)
        
    from .serializers import LearningAreaSerializer
    serializer = LearningAreaSerializer(area)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_class_attendance(request):
    """
    API endpoint to get class attendance data for authenticated teacher.
    Returns attendance records aggregated by course and date with attendance rates.
    """
    # Check if user is a teacher
    if not hasattr(request.user, 'teacher'):
        return Response({'error': 'Not a teacher account'}, status=403)
    
    teacher = request.user.teacher
    
    # Get all courses taught by the teacher
    courses = Course.objects.filter(teacher=teacher)
    
    # Aggregate attendance by course and date
    attendance_data = []
    
    for course in courses:
        students = course.enrolled_students.all()
        
        # Get unique dates with attendance records for this course's students
        dates = Attendance.objects.filter(
            student__in=students
        ).values_list('date', flat=True).distinct().order_by('-date')
        
        for date in dates:
            # Calculate attendance rate for this course on this date
            total_students = students.count()
            if total_students == 0:
                continue
            
            present_count = Attendance.objects.filter(
                student__in=students,
                date=date,
                status='Present'
            ).count()
            
            attendance_rate = round((present_count / total_students) * 100)
            
            attendance_data.append({
                'id': f"{course.id}_{date}",
                'course': course.name,
                'date': date.isoformat(),
                'attendanceRate': attendance_rate
            })
    
    return Response(attendance_data)