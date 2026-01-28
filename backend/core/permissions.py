from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow superusers, staff (finance), or users with an explicit admin profile
        return request.user.is_authenticated and (
            request.user.is_superuser or 
            request.user.is_staff or 
            hasattr(request.user, 'adminprofile')
        )

class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'teacherprofile')

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'studentprofile')