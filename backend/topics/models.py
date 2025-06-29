from django.db import models
from courses.models import Course  # foreign key to course
from django.contrib.auth import get_user_model

User = get_user_model()

class MainTopic(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='main_topics')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='main_topics', null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title
    


class SubTopic(models.Model):
    main_topic = models.ForeignKey('MainTopic', on_delete=models.CASCADE, related_name='subtopics')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subtopics', null=True)
    completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.main_topic.title})"


class Question(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='revision_questions', null=True)
    main_topic = models.ForeignKey(MainTopic, on_delete=models.CASCADE, related_name='revision_questions')
    question_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Q: {self.question_text[:50]} (by {self.created_by})"

class Answer(models.Model):
    question = models.OneToOneField(Question, on_delete=models.CASCADE, related_name='answer')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='revision_answers', null=True)
    answer_text = models.TextField()
    is_ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Answer by {self.created_by} for Q{self.question.id} (AI: {self.is_ai_generated})"
    

class Schedule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    topic = models.ForeignKey(MainTopic, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.topic.title} on {self.date}"