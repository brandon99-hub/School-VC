from django.contrib import admin
from .models import (
    Assignment,
    AssignmentSubmission,
    Course,
    DiscussionComment,
    DiscussionThread,
    Lesson,
    LessonContent,
    Module,
    Quiz,
    QuizQuestion,
    QuizResponse,
    QuizSubmission,
    Schedule,
)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'teacher', 'credits', 'semester', 'is_active')
    list_filter = ('semester', 'is_active', 'start_date')
    search_fields = ('name', 'code', 'teacher__user__first_name', 'teacher__user__last_name')
    date_hierarchy = 'start_date'

    fieldsets = (
        ('Course Information', {
            'fields': ('name', 'code', 'description', 'credits')
        }),
        ('Assignment Details', {
            'fields': ('teacher', 'semester')
        }),
        ('Schedule', {
            'fields': ('start_date', 'end_date', 'is_active')
        })
    )


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'due_date', 'total_marks', 'status')
    list_filter = ('status', 'due_date', 'course')
    search_fields = ('title', 'description', 'course__name')
    date_hierarchy = 'due_date'

    fieldsets = (
        (None, {
            'fields': ('course', 'title', 'description')
        }),
        ('Assignment Details', {
            'fields': ('due_date', 'total_marks', 'status')
        })
    )


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('course', 'day', 'start_time', 'end_time', 'room_number')
    list_filter = ('day', 'course')
    search_fields = ('course__name', 'room_number')

    fieldsets = (
        (None, {
            'fields': ('course', 'day')
        }),
        ('Time and Location', {
            'fields': ('start_time', 'end_time', 'room_number')
        })
    )

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'learning_area', 'order', 'is_published')
    list_filter = ('learning_area', 'is_published')
    search_fields = ('title', 'learning_area__name', 'learning_area__code')


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'order', 'is_published')
    list_filter = ('module__learning_area', 'is_published')
    search_fields = ('title', 'module__title')


@admin.register(LessonContent)
class LessonContentAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'content_type', 'order')
    list_filter = ('content_type',)
    search_fields = ('title', 'lesson__title')


class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 0


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'time_limit_minutes', 'is_published')
    list_filter = ('is_published', 'lesson__module__learning_area')
    inlines = [QuizQuestionInline]


@admin.register(QuizSubmission)
class QuizSubmissionAdmin(admin.ModelAdmin):
    list_display = ('quiz', 'student', 'score', 'status', 'submitted_at')
    list_filter = ('status', 'quiz')
    search_fields = ('quiz__title', 'student__first_name', 'student__last_name')


@admin.register(QuizResponse)
class QuizResponseAdmin(admin.ModelAdmin):
    list_display = ('submission', 'question', 'is_correct')


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'student', 'status', 'submitted_at')
    list_filter = ('status', 'assignment__course')
    search_fields = ('assignment__title', 'student__first_name', 'student__last_name')


@admin.register(DiscussionThread)
class DiscussionThreadAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'lesson', 'created_by', 'is_pinned', 'created_at')
    list_filter = ('course', 'is_pinned')
    search_fields = ('title', 'body', 'course__name')


@admin.register(DiscussionComment)
class DiscussionCommentAdmin(admin.ModelAdmin):
    list_display = ('thread', 'author', 'created_at')
    list_filter = ('thread__course',)
    search_fields = ('body', 'author__first_name', 'author__last_name')
