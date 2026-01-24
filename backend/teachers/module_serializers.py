from rest_framework import serializers
from courses.models import Course, Module, Lesson


class ModuleSerializer(serializers.ModelSerializer):
    lessons = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = ['id', 'learning_area', 'title', 'description', 'order', 'is_published', 'release_date', 'lessons']
        read_only_fields = ['id']

    def get_lessons(self, obj):
        from .lesson_serializers import LessonSerializer
        lessons = obj.lessons.all().order_by('order')
        return LessonSerializer(lessons, many=True).data


class ModuleCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['learning_area', 'title', 'description', 'order', 'is_published', 'release_date']

    def validate_order(self, value):
        if value < 1:
            raise serializers.ValidationError("Order must be at least 1")
        return value


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'module', 'title', 'description', 'order', 'is_published', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
