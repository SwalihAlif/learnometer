from django.db import models
from courses.models import Course  # foreign key to course

class MainTopic(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='main_topics')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title
