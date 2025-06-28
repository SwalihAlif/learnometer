from django.urls import path
from .views import (
    MainTopicListCreateView, MainTopicRetrieveUpdateDestroyView, SubTopicListCreateView, SubTopicDetailView,
    SubtopicProgressChartView
    

) 

urlpatterns = [
    path('main-topic/', MainTopicListCreateView.as_view(), name='main-topic-list-create'),
    path('main-topic/<int:pk>/', MainTopicRetrieveUpdateDestroyView.as_view(), name='main-topic-detail'),

    path('sub-topics/', SubTopicListCreateView.as_view(), name='subtopic-list-create'),
    path('sub-topics/<int:pk>/', SubTopicDetailView.as_view(), name='subtopic-detail'),
    path('progress/subtopics/', SubtopicProgressChartView.as_view(), name='subtopic-progress'),

]
