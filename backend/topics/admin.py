from django.contrib import admin
from .models import MainTopic, SubTopic, Question, Answer, Schedule, AnswerAiGenerationEvent, ScheduleGenerationEvent, QuizGenerationEvent
from .models import LearningSchedule, LearningScheduleItem  

# Register your models here.
admin.site.register(MainTopic)
admin.site.register(SubTopic)
admin.site.register(Question)
admin.site.register(Answer)
admin.site.register(Schedule)
admin.site.register(AnswerAiGenerationEvent)
admin.site.register(ScheduleGenerationEvent)
admin.site.register(QuizGenerationEvent)




class LearningScheduleItemInline(admin.TabularInline):
    model = LearningScheduleItem
    extra = 0

@admin.register(LearningSchedule)
class LearningScheduleAdmin(admin.ModelAdmin):
    inlines = [LearningScheduleItemInline]
    list_display = ('id', 'user', 'created_at', 'updated_at')

@admin.register(LearningScheduleItem)
class LearningScheduleItemAdmin(admin.ModelAdmin):
    list_display = ('schedule', 'slno', 'course', 'main_topic', 'date', 'day', 'start_time', 'end_time')
