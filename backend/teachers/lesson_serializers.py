from rest_framework import serializers
from courses.models import Lesson, LessonContent


class LessonContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonContent
        fields = '__all__'


class LessonSerializer(serializers.ModelSerializer):
    contents = LessonContentSerializer(many=True, read_only=True)

    class Meta:
        model = Lesson
        fields = ['id', 'module', 'title', 'summary', 'order', 'duration_minutes', 'is_published', 'release_date', 'contents']
        read_only_fields = ['id']


class LessonCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['module', 'title', 'summary', 'order', 'duration_minutes', 'is_published', 'release_date']

    def validate_order(self, value):
        if value < 1:
            raise serializers.ValidationError("Order must be at least 1")
        return value

    def validate_duration_minutes(self, value):
        if value < 0:
            raise serializers.ValidationError("Duration cannot be negative")
        return value
