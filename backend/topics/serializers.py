from rest_framework import serializers
from .models import MainTopic, SubTopic

class MainTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = MainTopic
        fields = ['id', 'course', 'title', 'description', 'created_at']

# serializers.py

class SubTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTopic
        fields = ['id', 'main_topic', 'title', 'description', 'created_at', 'completed']

