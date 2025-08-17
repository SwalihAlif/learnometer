from . models import AnswerAiGenerationEvent
from . models import ScheduleGenerationEvent
from . models import QuizGenerationEvent

# --------------------------- answer generation count

def log_answer_ai_generation(user, question_text, ai_model):
    AnswerAiGenerationEvent.objects.create(
        user=user,
        question_text=question_text,
        ai_model_used=ai_model
    )

def get_answer_ai_generation_count(user):
    return AnswerAiGenerationEvent.objects.filter(user=user).count()

# --------------------------- schedule generation count

def log_schedule_ai_generation(user, ai_model):
    ScheduleGenerationEvent.objects.create(
        user=user,
        ai_model_used = ai_model
    )

def get_schedule_generation_count(user):
    return ScheduleGenerationEvent.objects.filter(user=user).count()

# --------------------------- quiz generation count

def log_quiz_ai_generation(user, ai_model):
    QuizGenerationEvent.objects.create(
        user=user,
        ai_model_used = ai_model
    )

def get_quiz_generation_count(user):
    return QuizGenerationEvent.objects.filter(user=user).count()