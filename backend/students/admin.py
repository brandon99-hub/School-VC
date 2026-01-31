from django.contrib import admin
from django.contrib import admin
from .models import Student, Attendance


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'get_full_name', 'grade', 'phone', 'date_joined')
    list_filter = ('grade', 'gender', 'date_joined')
    search_fields = ('student_id', 'user__first_name', 'user__last_name', 'phone')
    date_hierarchy = 'date_joined'
    filter_horizontal = ()

    def get_full_name(obj):
        return obj.get_full_name()

    get_full_name.short_description = 'Full Name'

    fieldsets = (
        ('Personal Information', {
            'fields': ('user', 'student_id', 'date_of_birth', 'gender')
        }),
        ('Contact Information', {
            'fields': ('address', 'phone')
        }),
        ('Academic Information', {
            'fields': ('grade', 'grade_level', 'club', 'credit_balance')
        })
    )


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'learning_area', 'date', 'status')
    list_filter = ('status', 'date', 'learning_area')
    search_fields = ('student__user__first_name', 'student__user__last_name', 'student__student_id')
    date_hierarchy = 'date'

    fieldsets = (
        (None, {
            'fields': ('student', 'learning_area', 'date', 'status', 'remarks')
        }),
    )

# Register your models here.
