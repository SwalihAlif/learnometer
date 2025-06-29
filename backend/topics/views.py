from django.conf import settings
import google.generativeai as genai
from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions
from .models import MainTopic, SubTopic
from .serializers import MainTopicSerializer, SubTopicSerializer
from rest_framework.permissions import IsAuthenticated
import logging

logger = logging.getLogger(__name__)

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


from rest_framework import generics, permissions
from .models import Question, Answer
from .serializers import QuestionSerializer, AnswerSerializer


# --------- Question Views ---------

class QuestionListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        logger.info(f"Fetching questions for user: {user}")
        return Question.objects.filter(created_by=user).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        logger.info(f"Creating new question by user: {user}")
        serializer.save(created_by=user)

class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        logger.info(f"Accessing question detail for user: {user}")
        return Question.objects.filter(created_by=user)

# --------- Answer Views ---------

class AnswerCreateView(generics.CreateAPIView):
    serializer_class = AnswerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        logger.info(f"Creating new answer by user: {user}")
        serializer.save(created_by=user)

class AnswerDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnswerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        logger.info(f"Accessing answer detail for user: {user}")
        return Answer.objects.filter(created_by=user)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

import traceback
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import google.generativeai as genai
import logging

logger = logging.getLogger(__name__)
genai.configure(api_key=settings.GOOGLE_API_KEY)

class GenerateAIAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        question_text = request.data.get("question_text")

        logger.info(f"[AI REQUEST] User '{user}' requested AI answer for: '{question_text}'")

        if not question_text:
            logger.warning(f"[AI WARNING] User '{user}' submitted empty question_text")
            return Response({"error": "Question text is required"}, status=400)

        try:
            model = genai.GenerativeModel(
                model_name="models/gemini-1.5-flash",
                system_instruction="Respond concisely in 2–3 lines."
            )
            prompt = f"Answer briefly in 2–3 lines: {question_text}"
            response = model.generate_content(prompt)

            logger.info(f"[AI SUCCESS] Answer generated for user '{user}'")
            return Response({"ai_answer": response.text})

        except Exception as e:
            error_message = str(e)
            logger.error(
                f"[AI ERROR] Failed to generate answer for user '{user}': {error_message}\n{traceback.format_exc()}"
            )

            # Handle known quota error with 429 Too Many Requests
            if "quota" in error_message.lower() or "429" in error_message:
                return Response({"error": "Quota limit exceeded. Please try again later."}, status=429)

            return Response({"error": "AI generation failed"}, status=500)

