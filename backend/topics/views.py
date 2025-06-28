from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions
from .models import MainTopic, SubTopic
from .serializers import MainTopicSerializer, SubTopicSerializer
from rest_framework.permissions import IsAuthenticated

class MainTopicListCreateView(generics.ListCreateAPIView):
    serializer_class = MainTopicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course_id = self.request.query_params.get('course_id')
        return MainTopic.objects.filter(course_id=course_id)



class MainTopicRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MainTopic.objects.all()
    serializer_class = MainTopicSerializer
    permission_classes = [IsAuthenticated]



# List + Create
class SubTopicListCreateView(generics.ListCreateAPIView):
    serializer_class = SubTopicSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        main_topic_id = self.request.query_params.get('main_topic_id')
        return SubTopic.objects.filter(main_topic_id=main_topic_id)

    def perform_create(self, serializer):
        serializer.save()

# Retrieve + Update + Delete
class SubTopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SubTopic.objects.all()
    serializer_class = SubTopicSerializer
    permission_classes = [permissions.IsAuthenticated]


# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from topics.models import SubTopic
from topics.serializers import SubTopicSerializer

class SubtopicProgressChartView(APIView):
    permission_classes = [IsAuthenticated]  # optional, based on your app needs

    def get(self, request):
        main_topic_id = request.query_params.get('main_topic_id')
        if not main_topic_id:
            return Response({"error": "main_topic_id is required."}, status=400)

        subtopics = SubTopic.objects.filter(main_topic_id=main_topic_id)
        completed = subtopics.filter(completed=True).count()
        total = subtopics.count()

        return Response({
            "completed": completed,
            "total": total
        })
