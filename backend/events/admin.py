from django.contrib import admin
from .models import Club, EventNotice, ClubAttendance, EventAttendance

@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ('name', 'teacher', 'created_at')
    search_fields = ('name', 'teacher__user__first_name', 'teacher__user__last_name')

@admin.register(EventNotice)
class EventNoticeAdmin(admin.ModelAdmin):
    list_display = ('title', 'start_date', 'end_date', 'has_fee', 'cost', 'target_type')
    list_filter = ('has_fee', 'target_type', 'start_date')
    search_fields = ('title', 'description', 'location')
    filter_horizontal = ('target_grades', 'target_clubs')

@admin.register(ClubAttendance)
class ClubAttendanceAdmin(admin.ModelAdmin):
    list_display = ('club', 'student', 'date', 'is_present')
    list_filter = ('club', 'date', 'is_present')
    search_fields = ('student__user__first_name', 'student__user__last_name', 'club__name')

@admin.register(EventAttendance)
class EventAttendanceAdmin(admin.ModelAdmin):
    list_display = ('event', 'student', 'date', 'is_present')
    list_filter = ('event', 'date', 'is_present')
    search_fields = ('student__user__first_name', 'student__user__last_name', 'event__title')
