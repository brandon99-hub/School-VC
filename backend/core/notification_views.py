"""
Notification API views and serializers
"""

from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.contenttypes.models import ContentType
from core.notification_models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 'link_url',
            'is_read', 'created_at', 'read_at'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get notifications for current user"""
        user = self.request.user
        
        # Determine user type and get appropriate notifications
        if hasattr(user, 'student'):
            from students.models import Student
            content_type = ContentType.objects.get_for_model(Student)
            return Notification.objects.filter(
                recipient_type=content_type,
                recipient_id=user.id
            )
        elif hasattr(user, 'teacher'):
            from teachers.models import Teacher
            content_type = ContentType.objects.get_for_model(Teacher)
            return Notification.objects.filter(
                recipient_type=content_type,
                recipient_id=user.id
            )
        
        return Notification.objects.none()
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get count of unread notifications
        GET /api/notifications/unread-count/
        """
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark a notification as read
        POST /api/notifications/{id}/mark-read/
        """
        notification = self.get_object()
        notification.mark_as_read()
        return Response(self.get_serializer(notification).data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Mark all notifications as read
        POST /api/notifications/mark-all-read/
        """
        from django.utils import timezone
        self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'message': 'All notifications marked as read'})
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """
        Delete all read notifications
        DELETE /api/notifications/clear-all/
        """
        count = self.get_queryset().filter(is_read=True).delete()[0]
        return Response({'message': f'Deleted {count} notifications'})
