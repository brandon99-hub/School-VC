from django.contrib import admin
from django.contrib import admin
from .models import Teacher, TeacherAttendance


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('teacher_id', 'get_full_name', 'qualification', 'specialization', 'experience_years', 'date_joined')
    list_filter = ('qualification', 'date_joined')
    search_fields = ('teacher_id', 'user__first_name', 'user__last_name', 'specialization')
    date_hierarchy = 'date_joined'

    def get_full_name(self, obj):
        return obj.user.get_full_name()

    get_full_name.short_description = 'Full Name'

    fieldsets = (
        ('Personal Information', {
            'fields': ('user', 'teacher_id', 'date_of_birth')
        }),
        ('Professional Information', {
            'fields': ('qualification', 'specialization', 'experience_years')
        }),
        ('Contact Information', {
            'fields': ('address', 'phone')
        })
    )


@admin.register(TeacherAttendance)
class TeacherAttendanceAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'date', 'status')
    list_filter = ('status', 'date')
    search_fields = ('teacher__user__first_name', 'teacher__user__last_name', 'teacher__teacher_id')
    date_hierarchy = 'date'

    fieldsets = (
        (None, {
            'fields': ('teacher', 'date', 'status', 'leave_reason')
        }),
    )

# Register your models here.
