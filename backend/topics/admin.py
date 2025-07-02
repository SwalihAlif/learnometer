from django.contrib import admin
from .models import MainTopic, SubTopic, Question, Answer, Schedule

# Register your models here.
admin.site.register(MainTopic)
admin.site.register(SubTopic)
admin.site.register(Question)
admin.site.register(Answer)
admin.site.register(Schedule)
