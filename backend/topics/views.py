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
        serializer.save(created_by=self.request.user)

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
        main_topic_id = self.request.query_params.get('main_topic', None)
        logger.info(f"Fetching questions for user: {user} and Main topic: {main_topic_id}")

        queryset = Question.objects.filter(created_by=user)
        if main_topic_id is not None:
            queryset = queryset.filter(main_topic=main_topic_id)
        return queryset.order_by('-created_at')

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
from . services import log_answer_ai_generation, get_answer_ai_generation_count

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

            log_answer_ai_generation(user, question_text, "Gemini")

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

                log_answer_ai_generation(user, question_text, "Cohere")

                return Response({"ai_answer": text, "model": "Cohere"})
            except Exception as ce:
                logger.error(
                    f"[Cohere ERROR] Failed to generate answer for user '{user}': {str(ce)}\n{traceback.format_exc()}"
                )
                return Response({"error": "Both Gemini and Cohere failed to respond."}, status=500)
            


from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from datetime import datetime, timedelta
import json, re, logging
import google.generativeai as genai
import cohere
from .models import MainTopic, Schedule
from .serializers import ScheduleSerializer
from .services import log_schedule_ai_generation, get_schedule_generation_count

genai.configure(api_key=settings.GOOGLE_API_KEY)
cohere_client = cohere.Client(settings.COHERE_API_KEY)
logger = logging.getLogger(__name__)

# class GenerateLearningScheduleView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         user = request.user
#         topics = MainTopic.objects.filter(created_by=user)
#         if not topics.exists():
#             return Response({"detail": "No topics available"}, status=400)

#         availability = user.user_profile.availability_schedule
#         topic_lines = [f"{t.title}: {t.description or 'No description'}" for t in topics]

#         today = datetime.today().date()
#         next_day = today + timedelta(days=1)
#         next_day_str = next_day.strftime("%Y-%m-%d")

#         prompt = (
#             f"Availability:\n{json.dumps(availability, indent=2)}\n\n"
#             f"Topics:\n{chr(10).join(topic_lines)}\n\n"
#             "Distribute the topics in available times. Use future dates.\n"
#             "Return result like:\n"
#             f'{(next_day_str): [{"title": "HTML", "start": "10:00", "end": "11:00"}]}'
#         )

#         try:
#             model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")
#             response = model.generate_content(prompt)
#             output = re.search(r"(\{.*\})", response.text, re.DOTALL)
#             data = json.loads(output.group(1)) if output else {}
#             log_schedule_ai_generation(user, "Gemini")
#         except:
#             try:
#                 res = cohere_client.generate(model="command-r-plus", prompt=prompt, max_tokens=300)
#                 output = re.search(r"(\{.*\})", res.generations[0].text, re.DOTALL)
#                 data = json.loads(output.group(1)) if output else {}
#                 log_schedule_ai_generation(user, "Cohere")
#             except Exception as e:
#                 return Response({"error": "AI failed", "details": str(e)}, status=500)

#         Schedule.objects.filter(user=user).delete()
#         created = []
#         for date_str, items in data.items():
#             for item in items:
#                 topic = topics.filter(title=item.get("title")).first()
#                 if topic:
#                     s = Schedule.objects.create(
#                         user=user,
#                         topic=topic,
#                         date=date_str,
#                         start_time=item["start"],
#                         end_time=item["end"]
#                     )   
#                     created.append(s)

#         return Response(ScheduleSerializer(created, many=True).data)
    
import logging
import json
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import LearningSchedule, LearningScheduleItem
from users.models import UserProfile
from courses.models import Course

import cohere
import google.generativeai as genai

genai.configure(api_key=settings.GOOGLE_API_KEY)
cohere_client = cohere.Client(settings.COHERE_API_KEY)
logger = logging.getLogger(__name__)

def call_genai_schedule_ai(prompt):
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini/Gemai call failed: {e}")
        raise RuntimeError("Gemini failed")

def call_cohere_schedule_ai(prompt):
    try:
        response = cohere_client.generate(
            model='command',
            prompt=prompt,
            max_tokens=500,
            temperature=0.5
        )
        return response.generations[0].text
    except Exception as e:
        logger.error(f"Cohere call failed: {e}")
        raise RuntimeError("Cohere failed")

def parse_time(value):
    """
    Accepts 'HH:MM:SS' or 'HH:MM' and returns a time object.
    """
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            return datetime.strptime(value, fmt).time()
        except ValueError:
            continue
    raise ValueError(f"Time data '{value}' does not match format '%H:%M[:%S]'")

class GenerateLearningScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return self._generate_schedule(request)

    def post(self, request):
        return self._generate_schedule(request)

    def _generate_schedule(self, request):
        user = request.user

        # Get user profile and validate
        try:
            profile = user.user_profile
        except UserProfile.DoesNotExist:
            logger.error(f"UserProfile does not exist for user {user}")
            return Response({"detail": "User profile not found."}, status=status.HTTP_404_NOT_FOUND)

        # Validate availability_schedule
        availability = profile.availability_schedule
        if not availability or not isinstance(availability, dict):
            logger.error(f"Invalid or missing availability_schedule for user {user}")
            return Response({"detail": "Invalid or missing availability schedule."}, status=status.HTTP_400_BAD_REQUEST)

        # Get courses and main topics
        courses = user.courses.prefetch_related('main_topics').all()
        if not courses:
            logger.warning(f"No courses found for user {user}")
            return Response({"detail": "No courses found for this user."}, status=status.HTTP_404_NOT_FOUND)

        courses_data = []
        for course in courses:
            topics = list(course.main_topics.values_list('title', flat=True))
            if not topics:
                logger.warning(f"No topics in course {course.title} for user {user}")
                continue
            courses_data.append({
                "title": course.title,
                "topics": topics
            })

        if not courses_data:
            logger.warning(f"No topics found in any courses for user {user}")
            return Response({"detail": "No topics found in your courses."}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        next_day = today + timedelta(days=1)
        prompt = f"""
You are a learning scheduler AI. Here are the user's courses and topics:

Courses and Topics:
{json.dumps(courses_data, ensure_ascii=False)}

User's Weekly Availability: {json.dumps(availability, ensure_ascii=False)}

Today's date is {today}.
The schedule should start from the next available day, which is {next_day}.

Generate a schedule assigning a date, day, start time, and end time for each main topic, using the user's available days and times. Each topic should be scheduled in the next available slot, moving day by day as needed.

For start time and end time, always use 24-hour format with seconds (e.g., '01:30:00'). If that's not possible, you may use '01:30'.

Return as a JSON list in this format (do not include any explanation):
[
    [slno, course, main topic, date, day, start time, end time],
    ...
]
"""

        logger.info(f"Sending schedule generation prompt for user {user.id}")

        # Try Gemini first, fallback to Cohere if fails
        ai_result = None
        try:
            ai_result = call_genai_schedule_ai(prompt)
            logger.info("Schedule generated using Gemini.")
            log_schedule_ai_generation(user, "Gemini")
        except Exception as gemini_err:
            logger.error(f"Gemini failed, trying Cohere. Error: {gemini_err}")
            try:
                ai_result = call_cohere_schedule_ai(prompt)
                logger.info("Schedule generated using Cohere fallback.")
                log_schedule_ai_generation(user, "Cohere")
            except Exception as cohere_err:
                logger.exception("Both Gemini and Cohere failed for learning schedule generation.")
                return Response({"detail": "AI schedule generation failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        logger.debug(f"Raw AI response: {ai_result}")

        # Try to parse AI output as JSON
        try:
            start = ai_result.find('[')
            end = ai_result.rfind(']')
            if start == -1 or end == -1:
                raise ValueError("No JSON list found in AI output.")
            schedule_list = json.loads(ai_result[start:end+1])
        except Exception as e:
            logger.error(f"Failed to parse AI output as JSON: {e}")
            return Response({"detail": "Failed to parse AI schedule output."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Validate rows
        valid_rows = []
        for i, row in enumerate(schedule_list):
            if len(row) != 7:
                logger.warning(f"Row {i} in schedule does not have 7 columns: {row}")
            else:
                valid_rows.append(row)
        if not valid_rows:
            logger.error("No valid rows in generated schedule.")
            return Response({"detail": "No valid schedule items generated."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save to DB (replace old schedule)
        with transaction.atomic():
            # Remove old schedule for this user (optional: only keep most recent)
            LearningSchedule.objects.filter(user=user).delete()
            schedule_obj = LearningSchedule.objects.create(user=user)
            items = []
            for row in valid_rows:
                # [slno, course, main_topic, date, day, start_time, end_time]
                try:
                    slno = int(row[0])
                    course = row[1]
                    main_topic = row[2]
                    date = datetime.strptime(row[3], "%Y-%m-%d").date()
                    day = row[4]
                    start_time = parse_time(row[5])
                    end_time = parse_time(row[6])
                    items.append(LearningScheduleItem(
                        schedule=schedule_obj,
                        slno=slno,
                        course=course,
                        main_topic=main_topic,
                        date=date,
                        day=day,
                        start_time=start_time,
                        end_time=end_time
                    ))
                except Exception as e:
                    logger.error(f"Failed to parse row into LearningScheduleItem: {row} ({e})")
            LearningScheduleItem.objects.bulk_create(items)

        # Return the schedule as response
        results = [
            {
                "slno": item.slno,
                "course": item.course,
                "main_topic": item.main_topic,
                "date": item.date.strftime("%Y-%m-%d"),
                "day": item.day,
                "start_time": item.start_time.strftime("%H:%M:%S"),
                "end_time": item.end_time.strftime("%H:%M:%S"),
            } for item in schedule_obj.items.all()
        ]

        return Response({"schedule": results}, status=status.HTTP_200_OK)




from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import LearningSchedule, LearningScheduleItem

class LearnerScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            schedule = LearningSchedule.objects.filter(user=user).latest('created_at')
        except LearningSchedule.DoesNotExist:
            return Response({"detail": "No learning schedule found for this user."}, status=status.HTTP_404_NOT_FOUND)

        items = schedule.items.order_by('slno').all()
        result = [
            {
                "slno": item.slno,
                "course": item.course,
                "main_topic": item.main_topic,
                "date": item.date.strftime("%Y-%m-%d"),
                "day": item.day,
                "start_time": item.start_time.strftime("%H:%M:%S"),
                "end_time": item.end_time.strftime("%H:%M:%S"),
            } for item in items
        ]
        return Response({"schedule": result}, status=status.HTTP_200_OK)
 


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
from .services import log_quiz_ai_generation, get_quiz_generation_count

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

                log_quiz_ai_generation(user, source_model)

            except Exception as parse_error:
                logger.error(f"[AI ERROR] Parsing failed for question '{question.question_text}': {parse_error}")
                continue

        return Response(quiz_data)

# ---------------------- user progress report ------------------------------------------------------
from courses.models import Course
from rest_framework.decorators import api_view
from rest_framework.response import Response

def get_user_course_progress(user):
    courses = Course.objects.filter(learner=user)
    report = []

    for course in courses:
        subtopics = SubTopic.objects.filter(main_topic__course=course)
        completed_count = subtopics.filter(completed=True).count()
        total_count = subtopics.count()
        progress = (completed_count / total_count * 100) if total_count else 0
        score = round(progress)  # As percentage score

        report.append({
            'course_title': course.title,
            'completed': completed_count,
            'total': total_count,
            'score': score
        })
    
    return report



@api_view(['GET'])
def user_progress_report(request):
    report = get_user_course_progress(request.user)
    return Response(report)

