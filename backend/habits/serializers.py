from rest_framework import serializers
from .models import Habit, HabitProgress

class HabitProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitProgress
        fields = ['day_number', 'is_completed']

class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = ['id', 'title', 'total_days']