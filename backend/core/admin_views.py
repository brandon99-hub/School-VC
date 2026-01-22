from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from courses.models import Course
from teachers.models import Teacher
from students.models import Student


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_courses(request):
    """List all courses or create a new course"""
    if not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=403)
    
    if request.method == 'GET':
        courses = Course.objects.all().select_related('teacher', 'teacher__user')
        data = []
        for course in courses:
            data.append({
                'id': course.id,
                'name': course.name,
                'code': course.code,
                'description': course.description,
                'credits': course.credits,
                'semester': course.semester,
                'teacher': course.teacher.id,
                'teacher_name': f"{course.teacher.user.first_name} {course.teacher.user.last_name}".strip(),
                'start_date': course.start_date,
                'end_date': course.end_date,
                'is_active': course.is_active,
                'student_count': course.students.count(),
            })
        return Response(data)
    
    elif request.method == 'POST':
        try:
            teacher = Teacher.objects.get(id=request.data.get('teacher'))
            course = Course.objects.create(
                name=request.data.get('name'),
                code=request.data.get('code'),
                description=request.data.get('description'),
                credits=request.data.get('credits'),
                semester=request.data.get('semester'),
                teacher=teacher,
                start_date=request.data.get('start_date'),
                end_date=request.data.get('end_date'),
                is_active=request.data.get('is_active', True),
            )
            return Response({'id': course.id, 'message': 'Course created successfully'}, status=201)
        except Teacher.DoesNotExist:
            return Response({'teacher': 'Invalid teacher ID'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_course_detail(request, pk):
    """Get, update, or delete a specific course"""
    if not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=403)
    
    try:
        course = Course.objects.select_related('teacher', 'teacher__user').get(pk=pk)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)
    
    if request.method == 'GET':
        data = {
            'id': course.id,
            'name': course.name,
            'code': course.code,
            'description': course.description,
            'credits': course.credits,
            'semester': course.semester,
            'teacher': course.teacher.id,
            'teacher_name': f"{course.teacher.user.first_name} {course.teacher.user.last_name}".strip(),
            'start_date': course.start_date,
            'end_date': course.end_date,
            'is_active': course.is_active,
            'student_count': course.students.count(),
        }
        return Response(data)
    
    elif request.method == 'PUT':
        try:
            if 'teacher' in request.data:
                course.teacher = Teacher.objects.get(id=request.data['teacher'])
            course.name = request.data.get('name', course.name)
            course.code = request.data.get('code', course.code)
            course.description = request.data.get('description', course.description)
            course.credits = request.data.get('credits', course.credits)
            course.semester = request.data.get('semester', course.semester)
            course.start_date = request.data.get('start_date', course.start_date)
            course.end_date = request.data.get('end_date', course.end_date)
            course.is_active = request.data.get('is_active', course.is_active)
            course.save()
            return Response({'message': 'Course updated successfully'})
        except Teacher.DoesNotExist:
            return Response({'teacher': 'Invalid teacher ID'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
    
    elif request.method == 'DELETE':
        course.delete()
        return Response({'message': 'Course deleted successfully'}, status=204)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_teachers(request):
    """List all teachers for dropdown"""
    if not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=403)
    
    teachers = Teacher.objects.all().select_related('user')
    data = []
    for teacher in teachers:
        data.append({
            'id': teacher.id,
            'name': f"{teacher.user.first_name} {teacher.user.last_name}".strip() or teacher.user.email,
            'email': teacher.user.email,
        })
    return Response(data)
