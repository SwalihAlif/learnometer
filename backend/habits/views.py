from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Habit, HabitProgress
from .serializers import HabitSerializer, HabitProgressSerializer
from django.utils import timezone

class HabitListCreateView(generics.ListCreateAPIView):
    serializer_class = HabitSerializer

    def get_queryset(self):
        return Habit.objects.filter(learner=self.request.user)

    def perform_create(self, serializer):
        habit = serializer.save(learner=self.request.user)
        for i in range(1, habit.total_days + 1):
            HabitProgress.objects.create(habit=habit, day_number=i)

class HabitRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HabitSerializer
    queryset = Habit.objects.all()

    def get_queryset(self):
        return Habit.objects.filter(learner=self.request.user)

class HabitProgressListView(APIView):
    def get(self, request, habit_id):
        habit = get_object_or_404(Habit, id=habit_id, learner=request.user)
        progress = habit.progress.all().order_by('day_number')
        serializer = HabitProgressSerializer(progress, many=True)
        return Response(serializer.data)

class MarkHabitDayCompleteView(APIView):
    def patch(self, request, habit_id, day_number):
        habit = get_object_or_404(Habit, id=habit_id, learner=request.user)
        progress = get_object_or_404(HabitProgress, habit=habit, day_number=day_number)
        progress.is_completed = True
        progress.completed_at = timezone.now()
        progress.save()
        return Response({'status': 'completed'}, status=status.HTTP_200_OK)
