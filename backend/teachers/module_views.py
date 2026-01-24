from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models
from courses.models import Course, Module, Lesson
from .module_serializers import ModuleSerializer, ModuleCreateUpdateSerializer
from cbc.models import LearningArea, Strand, SubStrand
from django.db import transaction


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def course_modules_list(request, course_id):
    """List all modules for a learning area or create a new module"""
    # In CBC-First, course_id passed from frontend is the LearningArea ID
    course = get_object_or_404(LearningArea, id=course_id)
    
    # Check if user is the teacher for this course
    if not hasattr(request.user, 'teacher') or course.teacher != request.user.teacher:
        return Response(
            {'error': 'You do not have permission to manage this course'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        modules = Module.objects.filter(learning_area=course)
        serializer = ModuleSerializer(modules, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ModuleCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            # Handle order conflicts
            order = serializer.validated_data.get('order', 1)
            existing_module = Module.objects.filter(learning_area=course, order=order).first()
            if existing_module:
                # Shift other modules down
                Module.objects.filter(learning_area=course, order__gte=order).update(order=models.F('order') + 1)
            
            module = serializer.save(learning_area=course)
            return Response(ModuleSerializer(module).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def module_detail(request, module_id):
    """Retrieve, update or delete a module"""
    module = get_object_or_404(Module, id=module_id)
    
    # Check if user is the teacher for this area
    if not hasattr(request.user, 'teacher') or module.learning_area.teacher != request.user.teacher:
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
        course = module.learning_area
        order = module.order
        module.delete()
        Module.objects.filter(learning_area=course, order__gt=order).update(order=models.F('order') - 1)
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def reorder_modules(request, course_id):
    """Reorder modules for a learning area"""
    course = get_object_or_404(LearningArea, id=course_id)
    
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
            Module.objects.filter(id=module_id, learning_area=course).update(order=new_order)
    
    # Return updated list
    modules = Module.objects.filter(learning_area=course)
    serializer = ModuleSerializer(modules, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_course_from_registry(request, course_id):
    """
    Sync a teacher's workspace with the global CBC registry.
    Creates Modules (from Strands) and Lessons (from Sub-strands).
    """
    learning_area = get_object_or_404(LearningArea, id=course_id)
    
    # Check permission
    if not hasattr(request.user, 'teacher') or learning_area.teacher != request.user.teacher:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        with transaction.atomic():
            strands = learning_area.strands.all().prefetch_related('sub_strands')
            
            created_modules = 0
            created_lessons = 0
            
            for strand in strands:
                # 1. Create Module from Strand
                # Check if it already exists by title to avoid duplicates
                module, m_created = Module.objects.get_or_create(
                    learning_area=learning_area,
                    title=strand.name,
                    defaults={
                        'description': strand.description or f"Official CBC Strand: {strand.name}",
                        'order': strand.order,
                        'is_published': False
                    }
                )
                if m_created: created_modules += 1
                
                # 2. Create Lessons from SubStrands
                for sub in strand.sub_strands.all():
                    lesson, l_created = Lesson.objects.get_or_create(
                        module=module,
                        title=sub.name,
                        defaults={
                            'summary': sub.description or f"Official CDC Sub-strand: {sub.name}",
                            'order': sub.order,
                            'is_published': False
                        }
                    )
                    if l_created: created_lessons += 1
            
            return Response({
                'message': f'Sync complete. Created {created_modules} strands and {created_lessons} sub-strands.',
                'modules_created': created_modules,
                'lessons_created': created_lessons
            })
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
