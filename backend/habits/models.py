from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Habit(models.Model):
    learner = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    total_days = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

class HabitProgress(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='progress')
    day_number = models.PositiveIntegerField()
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)