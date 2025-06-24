from django.shortcuts import render

# Create your views here.
from rest_framework import generics
from .models import MainTopic
from .serializers import MainTopicSerializer
from rest_framework.permissions import IsAuthenticated

class MainTopicListCreateView(generics.ListCreateAPIView):
    serializer_class = MainTopicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course_id = self.request.query_params.get('course_id')
        return MainTopic.objects.filter(course_id=course_id)

from rest_framework import generics
from .models import MainTopic
from .serializers import MainTopicSerializer
from rest_framework.permissions import IsAuthenticated

class MainTopicRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MainTopic.objects.all()
    serializer_class = MainTopicSerializer
    permission_classes = [IsAuthenticated]
