from django.urls import path
from .views import (
    HabitListCreateView, 
    HabitProgressListView, 
    MarkHabitDayCompleteView, 
    HabitRetrieveUpdateDestroyView,
    CompletedHabitsView,
    )

urlpatterns = [
    path('list-create/', HabitListCreateView.as_view(), name='habit-list-create'),
    path('list/<int:habit_id>/progress/', HabitProgressListView.as_view(), name='habit-progress'),
    path('complete/<int:habit_id>/progress/<int:day_number>/', MarkHabitDayCompleteView.as_view(), name='habit-day-complete'),
    path('list-create/<int:pk>/', HabitRetrieveUpdateDestroyView.as_view()),
    path('completed/', CompletedHabitsView.as_view()),
]
