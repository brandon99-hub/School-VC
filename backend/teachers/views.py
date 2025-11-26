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
from courses.models import Course, Assignment, Schedule
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
    """DRF API endpoint for teacher's assigned courses"""
    if not hasattr(request.user, 'teacher'):
        return Response({'error': 'Forbidden'}, status=403)

    courses = request.user.teacher.course_set.all()
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_class_attendance(request, pk):
    """
    API endpoint to get class attendance data for a teacher.
    Returns attendance records for students in the teacher's courses.
    """
    try:
        teacher = Teacher.objects.get(pk=pk)
    except Teacher.DoesNotExist:
        return Response({'error': 'Teacher not found'}, status=404)

    # Check if the requesting user is the teacher or an admin
    if not (request.user.is_superuser or (hasattr(request.user, 'teacher') and request.user.teacher == teacher)):
        return Response({'error': 'Permission denied'}, status=403)

    # Get all courses taught by the teacher
    courses = Course.objects.filter(teacher=teacher)

    # Get all students enrolled in these courses
    students = Student.objects.filter(enrolled_courses__in=courses).distinct()

    # Get attendance records for these students
    attendance_records = Attendance.objects.filter(student__in=students)

    # Serialize the data
    attendance_data = [
        {
            'student_id': attendance.student.id,
            'student_name': f"{attendance.student.user.first_name} {attendance.student.user.last_name}",
            'course_id': attendance.student.enrolled_courses.filter(teacher=teacher).first().id,
            'course_name': attendance.student.enrolled_courses.filter(teacher=teacher).first().name,
            'date': attendance.date,
            'status': attendance.status,
        }
        for attendance in attendance_records
    ]

    return Response(attendance_data)