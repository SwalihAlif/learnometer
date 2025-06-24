from rest_framework import serializers
from .models import MainTopic

class MainTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = MainTopic
        fields = ['id', 'course', 'title', 'description', 'created_at']
