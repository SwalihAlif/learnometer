from django.conf import settings
import google.generativeai as genai
from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions
from .models import MainTopic, SubTopic, Question, Answer, Schedule
from .serializers import MainTopicSerializer, SubTopicSerializer
from rest_framework.permissions import IsAuthenticated
import logging
import random

logger = logging.getLogger(__name__)

class MainTopicListCreateView(generics.ListCreateAPIView):
    serializer_class = MainTopicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course_id = self.request.query_params.get('course_id')
        return MainTopic.objects.filter(course_id=course_id)
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)



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

import logging
import traceback
import cohere
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import google.generativeai as genai

logger = logging.getLogger(__name__)

# Configure both APIs
genai.configure(api_key=settings.GOOGLE_API_KEY)
cohere_client = cohere.Client(settings.COHERE_API_KEY)


class GenerateAIAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        question_text = request.data.get("question_text")

        logger.info(f"[AI REQUEST] User '{user}' requested AI answer for: '{question_text}'")

        if not question_text:
            logger.warning(f"[AI WARNING] User '{user}' submitted empty question_text")
            return Response({"error": "Question text is required"}, status=400)

        prompt = f"Answer briefly in 2–3 lines: {question_text}"

        # First try Gemini
        try:
            model = genai.GenerativeModel(
                model_name="models/gemini-1.5-flash",
                system_instruction="Respond concisely in 2–3 lines."
            )
            response = model.generate_content(prompt)
            logger.info(f"[AI SUCCESS] Answer generated for user '{user}' using Gemini")
            return Response({"ai_answer": response.text.strip(), "model": "Gemini"})
        except Exception as e:
            error_message = str(e)
            logger.warning(f"[Gemini FAILED] for {user}: {error_message}")

            # Try Cohere fallback
            try:
                cohere_response = cohere_client.generate(
                    prompt=prompt,
                    max_tokens=150,
                    temperature=0.5,
                    model="command-r-plus"
                )
                text = cohere_response.generations[0].text.strip()
                logger.info(f"[AI SUCCESS] Answer generated for user '{user}' using Cohere")
                return Response({"ai_answer": text, "model": "Cohere"})
            except Exception as ce:
                logger.error(
                    f"[Cohere ERROR] Failed to generate answer for user '{user}': {str(ce)}\n{traceback.format_exc()}"
                )
                return Response({"error": "Both Gemini and Cohere failed to respond."}, status=500)


import re
import json
import logging
from datetime import datetime, timedelta

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
import google.generativeai as genai
import cohere
from .models import MainTopic, Schedule
from .serializers import ScheduleSerializer

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GOOGLE_API_KEY)
cohere_client = cohere.Client(settings.COHERE_API_KEY)

# Helper functions
def get_next_date_for_day(day_name: str) -> str:
    weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    today = datetime.today()
    day_name_lower = day_name.lower()
    if day_name_lower not in weekdays:
        return None
    target_day = weekdays.index(day_name_lower)
    delta = (target_day - today.weekday() + 7) % 7
    target_date = today + timedelta(days=delta)
    return target_date.strftime("%Y-%m-%d")

def is_weekday_name(text: str) -> bool:
    return text.lower() in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']


class GenerateLearningScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        logger.info(f"Generating learning schedule for user: {user.email}")

        topics = MainTopic.objects.filter(created_by=user)
        if not topics.exists():
            logger.warning(f"No topics found for user: {user.email}")
            return Response({"detail": "No topics available to schedule."}, status=400)

        try:
            profile = user.user_profile
            availability = profile.availability_schedule
            logger.debug(f"User availability for {user.email}: {availability}")
        except Exception as e:
            logger.error(f"Failed to access user profile for {user.email}: {str(e)}")
            return Response({"error": "User availability not found."}, status=400)

        topic_lines = [f"{t.title}: {t.description or 'No description'}" for t in topics]
        prompt = (
            "You're a smart schedule generator.\n\n"
            "The learner has given the following availability for each day:\n"
            f"{json.dumps(availability, indent=2)}\n\n"
            "And these are the learning topics:\n"
            f"{chr(10).join(topic_lines)}\n\n"
            "Estimate time needed per topic based on complexity of title and description.\n"
            "Distribute them across available slots, avoid overlap.\n\n"
            f"Today is {datetime.today().strftime('%Y-%m-%d')}.\n"
            "Please generate a schedule using only future dates starting from today.\n"
            "Return result in JSON format like:\n"
            "{\n"
            '  "2025-07-18": [{"title": "HTML", "start": "10:00", "end": "11:00"}],\n'
            '  "2025-07-19": [{"title": "CSS", "start": "10:00", "end": "11:30"}]\n'
            "}"
        )

        logger.debug(f"Schedule generation prompt:\n{prompt}")

        data = None
        source_model = "Gemini"
        try:
            model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")
            response = model.generate_content(prompt)
            raw_output = response.text.strip()
            logger.debug(f"Raw Gemini response: {raw_output}")

            match = re.search(r"```json\s*(\{.*?\})\s*```", raw_output, re.DOTALL)
            if not match:
                match = re.search(r"(\{.*\})", raw_output, re.DOTALL)
            if not match:
                raise ValueError("Could not extract JSON from Gemini response")

            json_str = match.group(1)
            data = json.loads(json_str)

        except Exception as e:
            logger.warning(f"[Gemini FAILED] for {user.email}: {e} — Trying Cohere")
            source_model = "Cohere"
            try:
                cohere_response = cohere_client.generate(
                    model="command-r-plus",
                    prompt=prompt,
                    max_tokens=300,
                    temperature=0.4
                )
                output = cohere_response.generations[0].text.strip()
                logger.debug(f"Raw Cohere response: {output}")
                match = re.search(r"```json\s*(\{.*?\})\s*```", output, re.DOTALL)
                if not match:
                    match = re.search(r"(\{.*\})", output, re.DOTALL)
                if not match:
                    raise ValueError("Could not extract JSON from Cohere response")

                json_str = match.group(1)
                data = json.loads(json_str)
            except Exception as e2:
                logger.error(f"[Cohere FAILED] for {user.email}: {e2}")
                return Response({"error": "AI schedule generation failed", "details": str(e2)}, status=500)

        logger.debug(f"Parsed schedule JSON from {source_model}: {json.dumps(data, indent=2)}")

        Schedule.objects.filter(user=user).delete()
        logger.info(f"Cleared previous schedule for {user.email}")

        created = []
        for key, items in data.items():
            date_str = get_next_date_for_day(key) if is_weekday_name(key) else key

            if not date_str:
                logger.warning(f"Invalid date/day key: {key}")
                continue

            for item in items:
                topic = topics.filter(title=item.get("title")).first()
                if topic:
                    try:
                        s = Schedule.objects.create(
                            user=user,
                            topic=topic,
                            date=date_str,
                            start_time=item.get("start"),
                            end_time=item.get("end")
                        )
                        created.append(s)
                        logger.debug(f"Created schedule: {s}")
                    except Exception as e:
                        logger.error(f"Error saving schedule for topic '{item.get('title')}': {str(e)}")

        logger.info(f"Generated {len(created)} schedule items for {user.email} using {source_model}")
        return Response(ScheduleSerializer(created, many=True).data)



from datetime import date
from collections import defaultdict

class LearnerScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # First try: Future schedules
        schedules = Schedule.objects.filter(user=user, date__gte=date.today()).order_by('date', 'start_time')

        # If none, fallback: All schedules
        if not schedules.exists():
            schedules = Schedule.objects.filter(user=user).order_by('date', 'start_time')

        grouped = defaultdict(list)
        for s in schedules:
            grouped[str(s.date)].append({
                "id": s.id,
                "topic": s.topic.id,
                "topic_title": s.topic.title,
                "date": str(s.date),
                "start_time": s.start_time.strftime('%H:%M:%S'),
                "end_time": s.end_time.strftime('%H:%M:%S'),
            })

        return Response(grouped)

    


import json
import logging
import random
import cohere
import google.generativeai as genai
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from topics.models import Question

logger = logging.getLogger(__name__)

# Configure APIs
genai.configure(api_key=settings.GOOGLE_API_KEY)
cohere_client = cohere.Client(settings.COHERE_API_KEY)

class GenerateAIQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, main_topic_id):
        user = request.user
        questions = list(
            Question.objects.filter(created_by=user, main_topic_id=main_topic_id)
        )

        if not questions:
            logger.info(f"[AI QUIZ] No questions found for user '{user}' and topic '{main_topic_id}'")
            return Response([])

        selected_questions = random.sample(questions, min(len(questions), 10))
        quiz_data = []

        for question in selected_questions:
            prompt = f"""
You are a quiz generator AI.

Generate 1 correct and 3 incorrect short options (half a line) for the following question:

Question: "{question.question_text}"

Reply ONLY in JSON format like this:
{{
  "options": [
    {{"text": "Correct answer", "is_correct": true}},
    {{"text": "Wrong option 1", "is_correct": false}},
    {{"text": "Wrong option 2", "is_correct": false}},
    {{"text": "Wrong option 3", "is_correct": false}}
  ]
}}
"""

            try:
                # Try Gemini first
                model = genai.GenerativeModel(
                    model_name="models/gemini-1.5-flash",
                    system_instruction="Generate quiz options only in the specified JSON format."
                )
                response = model.generate_content(prompt)
                raw_text = response.text.strip()
                source_model = "Gemini"

            except Exception as gemini_error:
                logger.warning(f"[FALLBACK] Gemini failed: {gemini_error}. Using Cohere.")
                try:
                    cohere_response = cohere_client.generate(
                        model="command-r-plus",
                        prompt=prompt,
                        max_tokens=300,
                        temperature=0.7,
                    )
                    raw_text = cohere_response.generations[0].text.strip()
                    source_model = "Cohere"
                except Exception as cohere_error:
                    logger.error(f"[AI ERROR] Both Gemini and Cohere failed: {cohere_error}")
                    continue

            try:
                # Clean text
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:].strip()
                elif raw_text.startswith("```"):
                    raw_text = raw_text[3:].strip()
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3].strip()

                logger.debug(f"[AI CLEANED RESPONSE - {source_model}] {raw_text}")
                parsed = json.loads(raw_text)
                options = parsed.get("options", [])

                if not isinstance(options, list) or len(options) < 4:
                    raise ValueError("Malformed or incomplete options list")

                random.shuffle(options)

                quiz_data.append({
                    "question_id": question.id,
                    "question": question.question_text,
                    "options": options,
                    "source": source_model
                })

            except Exception as parse_error:
                logger.error(f"[AI ERROR] Parsing failed for question '{question.question_text}': {parse_error}")
                continue

        return Response(quiz_data)



