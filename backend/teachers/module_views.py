from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models
from courses.models import Course, Module, Lesson
from .module_serializers import ModuleSerializer, ModuleCreateUpdateSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def course_modules_list(request, course_id):
    """List all modules for a course or create a new module"""
    course = get_object_or_404(Course, id=course_id)
    
    # Check if user is the teacher for this course
    if not hasattr(request.user, 'teacher') or course.teacher != request.user.teacher:
        return Response(
            {'error': 'You do not have permission to manage this course'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        modules = Module.objects.filter(course=course)
        serializer = ModuleSerializer(modules, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ModuleCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            # Handle order conflicts
            order = serializer.validated_data.get('order', 1)
            existing_module = Module.objects.filter(course=course, order=order).first()
            if existing_module:
                # Shift other modules down
                Module.objects.filter(course=course, order__gte=order).update(order=models.F('order') + 1)
            
            module = serializer.save()
            return Response(ModuleSerializer(module).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def module_detail(request, module_id):
    """Retrieve, update or delete a module"""
    module = get_object_or_404(Module, id=module_id)
    
    # Check if user is the teacher for this course
    if not hasattr(request.user, 'teacher') or module.course.teacher != request.user.teacher:
        return Response(
            {'error': 'You do not have permission to manage this module'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        serializer = ModuleSerializer(module)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ModuleCreateUpdateSerializer(module, data=request.data, partial=True)
        if serializer.is_valid():
            module = serializer.save()
            return Response(ModuleSerializer(module).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Reorder remaining modules
        course = module.course
        order = module.order
        module.delete()
        Module.objects.filter(course=course, order__gt=order).update(order=models.F('order') - 1)
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def reorder_modules(request, course_id):
    """Reorder modules for a course"""
    course = get_object_or_404(Course, id=course_id)
    
    # Check if user is the teacher for this course
    if not hasattr(request.user, 'teacher') or course.teacher != request.user.teacher:
        return Response(
            {'error': 'You do not have permission to manage this course'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    modules_data = request.data.get('modules', [])
    
    # Update order for each module
    for module_data in modules_data:
        module_id = module_data.get('id')
        new_order = module_data.get('order')
        
        if module_id and new_order:
            Module.objects.filter(id=module_id, course=course).update(order=new_order)
    
    # Return updated list
    modules = Module.objects.filter(course=course)
    serializer = ModuleSerializer(modules, many=True)
    return Response(serializer.data)
