from django.contrib import admin
from .models import MainTopic, SubTopic, Question, Answer, Schedule, AnswerAiGenerationEvent, ScheduleGenerationEvent, QuizGenerationEvent

# Register your models here.
admin.site.register(MainTopic)
admin.site.register(SubTopic)
admin.site.register(Question)
admin.site.register(Answer)
admin.site.register(Schedule)
admin.site.register(AnswerAiGenerationEvent)
admin.site.register(ScheduleGenerationEvent)
admin.site.register(QuizGenerationEvent)
