from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone


User = get_user_model()
# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Course(models.Model):
    learner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses')
    title = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='courses')
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class MainTopic(models.Model):
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='main_topics')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.title} ({self.course.title})"


class SubTopic(models.Model):
    main_topic = models.ForeignKey(MainTopic, on_delete=models.CASCADE, related_name='sub_topics')
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.title} ({self.main_topic.title})"
