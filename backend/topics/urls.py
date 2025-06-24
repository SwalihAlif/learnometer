from django.urls import path
from .views import MainTopicListCreateView, MainTopicRetrieveUpdateDestroyView

urlpatterns = [
    path('main-topic/', MainTopicListCreateView.as_view(), name='main-topic-list-create'),
    path('main-topic/<int:pk>/', MainTopicRetrieveUpdateDestroyView.as_view(), name='main-topic-detail'),
]
