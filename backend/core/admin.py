from django.contrib import admin
from django.contrib import admin
from .models import Announcement, Notification, AcademicYear

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'priority', 'created_at', 'is_active')
    list_filter = ('priority', 'is_active', 'created_at')
    search_fields = ('title', 'content')
    date_hierarchy = 'created_at'

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_at', 'is_read')
    list_filter = ('is_read', 'created_at')
    search_fields = ('title', 'message', 'user__username')
    date_hierarchy = 'created_at'

@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'is_current')
    list_filter = ('is_current',)
    search_fields = ('name',)

# Register your models here.
