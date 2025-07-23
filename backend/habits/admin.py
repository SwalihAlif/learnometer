from django.contrib import admin
from .models import Habit, HabitProgress

# Register your models here.

admin.site.register(Habit)
admin.site.register(HabitProgress)
