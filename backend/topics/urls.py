from django.urls import path
from .views import (
    MainTopicListCreateView, MainTopicRetrieveUpdateDestroyView, SubTopicListCreateView, SubTopicDetailView,
    SubtopicProgressChartView, QuestionListCreateView, QuestionDetailView,
    AnswerCreateView, AnswerDetailView,
    GenerateAIAnswerView
    

) 

urlpatterns = [
    path('main-topic/', MainTopicListCreateView.as_view(), name='main-topic-list-create'),
    path('main-topic/<int:pk>/', MainTopicRetrieveUpdateDestroyView.as_view(), name='main-topic-detail'),

    path('sub-topics/', SubTopicListCreateView.as_view(), name='subtopic-list-create'),
    path('sub-topics/<int:pk>/', SubTopicDetailView.as_view(), name='subtopic-detail'),
    path('progress/subtopics/', SubtopicProgressChartView.as_view(), name='subtopic-progress'),

    path('questions/', QuestionListCreateView.as_view(), name='question-list-create'),
    path('questions/<int:pk>/', QuestionDetailView.as_view(), name='question-detail'),

    path('answers/', AnswerCreateView.as_view(), name='answer-create'),
    path('answers/<int:pk>/', AnswerDetailView.as_view(), name='answer-detail'),

    path('generate-ai-answer/', GenerateAIAnswerView.as_view(), name='generate-ai-answer'),

]

