from django.shortcuts import render
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Q
from .models import Student, Attendance
from courses.models import Course, Attendance as CourseAttendance
from courses.serializers import CourseSerializer, AttendanceSerializer as CourseAttendanceSerializer
from django.contrib.auth.models import User
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_courses_api(request, student_id):
    try:
        # First check if student exists
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found'}, status=404)
        
        # Get courses and check if any exist
        courses = student.get_enrolled_courses()
        if not courses.exists():
            return Response([], status=200)  # Return empty list instead of error
            
        # Serialize the courses
        try:
            serializer = CourseSerializer(courses, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error serializing courses: {str(e)}")  # Add logging
            return Response({
                'detail': f'Error serializing courses: {str(e)}',
                'error_type': type(e).__name__
            }, status=500)
            
    except Exception as e:
        print(f"Unexpected error in student_courses_api: {str(e)}")  # Add logging
        return Response({
            'detail': f'Unexpected error: {str(e)}',
            'error_type': type(e).__name__
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_attendance(request, student_id):
    try:
        # First check if student exists
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found'}, status=404)
        
        # Get attendance records
        attendance = CourseAttendance.objects.filter(student=student)
        if not attendance.exists():
            return Response([], status=200)  # Return empty list instead of error
            
        # Serialize the attendance records
        try:
            serializer = CourseAttendanceSerializer(attendance, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error serializing attendance: {str(e)}")  # Add logging
            return Response({
                'detail': f'Error serializing attendance: {str(e)}',
                'error_type': type(e).__name__
            }, status=500)
            
    except Exception as e:
        print(f"Unexpected error in student_attendance: {str(e)}")  # Add logging
        return Response({
            'detail': f'Unexpected error: {str(e)}',
            'error_type': type(e).__name__
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_course(request):
    try:
        user = request.user
        # Check if the user is a Student instance
        if not isinstance(user, Student) and not hasattr(user, 'student'):
            return Response({'detail': 'Only students can enroll in courses.'}, status=403)

        student = user if isinstance(user, Student) else getattr(user, 'student', None)
        course_id = request.data.get('course_id')
        
        if not course_id:
            return Response({'detail': 'Course ID is required'}, status=400)
            
        try:
            course = Course.objects.get(id=course_id, is_active=True)
        except Course.DoesNotExist:
            return Response({'detail': 'Course not found or not active'}, status=404)
            
        # Check if already enrolled
        if course in student.enrolled_courses.all():
            return Response({'detail': 'Already enrolled in this course'}, status=400)
            
        # Add the course
        student.enrolled_courses.add(course)
        return Response({
            'detail': f'Successfully enrolled in {course.name}',
            'course': CourseSerializer(course).data
        }, status=201)
        
    except Exception as e:
        return Response({
            'detail': f'Error enrolling in course: {str(e)}',
            'error_type': type(e).__name__
        }, status=500)

def is_admin_or_teacher(user):
    return user.is_superuser or hasattr(user, 'teacher')


@login_required
@user_passes_test(is_admin_or_teacher)
def student_list(request):
    query = request.GET.get('q', '')
    students = Student.objects.all()

    if query:
        students = students.filter(
            Q(user__first_name__icontains=query) |
            Q(user__last_name__icontains=query) |
            Q(student_id__icontains=query) |
            Q(grade__icontains=query)
        )

    return render(request, 'students/student_list.html', {
        'students': students,
        'query': query
    })


@login_required
def student_detail(request, pk):
    student = get_object_or_404(Student, pk=pk)
    if not (request.user.is_superuser or hasattr(request.user, 'teacher') or request.user == student.user):
        messages.error(request, "You don't have permission to view this profile.")
        return redirect('core:dashboard')

    context = {
        'student': student,
        'enrolled_courses': student.enrolled_courses.all(),
        'attendance_records': student.course_attendance.all()[:10],
        'attendance_percentage': student.get_attendance_percentage()
    }
    return render(request, 'students/student_detail.html', context)


@login_required
@user_passes_test(lambda u: u.is_superuser)
def student_add(request):
    if request.method == 'POST':
        # Create user account
        user = User.objects.create_user(
            username=request.POST['username'],
            password=request.POST['password'],
            first_name=request.POST['first_name'],
            last_name=request.POST['last_name'],
            email=request.POST['email']
        )

        # Create student profile
        student = Student.objects.create(
            user=user,
            student_id=request.POST['student_id'],
            date_of_birth=request.POST['date_of_birth'],
            gender=request.POST['gender'],
            grade=request.POST['grade'],
            address=request.POST['address'],
            phone=request.POST['phone']
        )

        messages.success(request, 'Student added successfully.')
        return redirect('students:student_detail', pk=student.pk)

    return render(request, 'students/student_form.html')


@login_required
@user_passes_test(lambda u: u.is_superuser)
def student_edit(request, pk):
    student = get_object_or_404(Student, pk=pk)

    if request.method == 'POST':
        # Update user information
        user = student.user
        user.first_name = request.POST.get('first_name', user.first_name)
        user.last_name = request.POST.get('last_name', user.last_name)
        user.email = request.POST.get('email', user.email)
        user.save()

        # Update student information
        student.date_of_birth = request.POST.get('date_of_birth', student.date_of_birth)
        student.gender = request.POST.get('gender', student.gender)
        student.grade = request.POST.get('grade', student.grade)
        student.address = request.POST.get('address', student.address)
        student.phone = request.POST.get('phone', student.phone)
        student.save()

        messages.success(request, 'Student information updated successfully.')
        return redirect('students:student_detail', pk=student.pk)

    return render(request, 'students/student_form.html', {'student': student})


@login_required
@user_passes_test(lambda u: u.is_superuser)
def student_delete(request, pk):
    student = get_object_or_404(Student, pk=pk)
    if request.method == 'POST':
        user = student.user
        student.delete()
        user.delete()
        messages.success(request, 'Student deleted successfully.')
        return redirect('students:student_list')

    return render(request, 'students/student_confirm_delete.html', {'student': student})


@login_required
def attendance_list(request):
    if hasattr(request.user, 'student'):
        # Student viewing their own attendance
        student = request.user.student
        attendance_records = student.attendance_set.all()
    else:
        # Admin or teacher viewing attendance
        attendance_records = CourseAttendance.objects.all()
        if hasattr(request.user, 'teacher'):
            # Filter for courses taught by the teacher
            teacher_courses = request.user.teacher.course_set.all()
            student_ids = [student.id for course in teacher_courses for student in course.enrolled_students.all()]
            attendance_records = attendance_records.filter(student_id__in=student_ids)

    return render(request, 'students/attendance_list.html', {
        'attendance_records': attendance_records
    })


@login_required
@user_passes_test(is_admin_or_teacher)
def attendance_add(request):
    if request.method == 'POST':
        student_id = request.POST.get('student')
        date = request.POST.get('date')
        status = request.POST.get('status')

        student = get_object_or_404(Student, id=student_id)
        CourseAttendance.objects.create(
            student=student,
            date=date,
            status=status,
            remarks=request.POST.get('remarks', '')
        )

        messages.success(request, 'Attendance marked successfully.')
        return redirect('students:attendance_list')

    students = Student.objects.all()
    return render(request, 'students/attendance_form.html', {'students': students})


@login_required
def student_courses(request):
    if hasattr(request.user, 'student'):
        student = request.user.student
        enrolled_courses = student.enrolled_courses.all()
        available_courses = Course.objects.filter(is_active=True).exclude(
            id__in=enrolled_courses.values_list('id', flat=True))

        return render(request, 'students/student_courses.html', {
            'enrolled_courses': enrolled_courses,
            'available_courses': available_courses
        })

    messages.error(request, 'Only students can access this page.')
    return redirect('core:dashboard')


@login_required
def course_registration(request):
    if not hasattr(request.user, 'student'):
        messages.error(request, 'Only students can register for courses.')
        return redirect('core:dashboard')

    if request.method == 'POST':
        course_ids = request.POST.getlist('courses')
        student = request.user.student

        for course_id in course_ids:
            try:
                course = Course.objects.get(id=course_id, is_active=True)
                if course not in student.enrolled_courses.all():
                    student.enrolled_courses.add(course)
            except Course.DoesNotExist:
                messages.warning(request, f'Course with ID {course_id} not found or not active.')
                continue

        messages.success(request, 'Successfully registered for selected courses.')
        return redirect('students:student_courses')

    return redirect('students:student_courses')


@login_required
def course_drop(request, course_id):
    if not hasattr(request.user, 'student'):
        messages.error(request, 'Only students can drop courses.')
        return redirect('core:dashboard')

    try:
        course = Course.objects.get(id=course_id)
        student = request.user.student
        student.enrolled_courses.remove(course)
        messages.success(request, f'Successfully dropped course: {course.name}')
    except Course.DoesNotExist:
        messages.error(request, 'Course not found.')
    except Exception as e:
        messages.error(request, f'Error dropping course: {str(e)}')
        
    return redirect('students:student_courses')


# API endpoints for AJAX requests
@login_required
@user_passes_test(is_admin_or_teacher)
def mark_attendance(request):
    if request.method == 'POST':
        student_id = request.POST.get('student_id')
        date = request.POST.get('date')
        status = request.POST.get('status')

        student = get_object_or_404(Student, id=student_id)
        attendance, created = CourseAttendance.objects.update_or_create(
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
def get_attendance_status(request):
    if request.method == 'GET':
        student_id = request.GET.get('student_id')
        date = request.GET.get('date')

        try:
            attendance = CourseAttendance.objects.get(student_id=student_id, date=date)
            return JsonResponse({
                'status': 'success',
                'attendance_status': attendance.status
            })
        except CourseAttendance.DoesNotExist:
            return JsonResponse({
                'status': 'success',
                'attendance_status': None
            })

    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    }, status=400)

# Create your views here.
