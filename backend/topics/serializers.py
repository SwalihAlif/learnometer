from rest_framework import serializers
from .models import MainTopic, SubTopic, Question, Answer

class MainTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = MainTopic
        fields = ['id', 'course', 'title', 'description', 'created_at']

# serializers.py

class SubTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTopic
        fields = ['id', 'main_topic', 'title', 'description', 'created_at', 'completed']



class AnswerSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.user_profile.full_name')

    class Meta:
        model = Answer
        fields = ['id', 'question', 'answer_text', 'is_ai_generated', 'created_by', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

class QuestionSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.user_profile.full_name')
    answer = AnswerSerializer(read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'main_topic', 'question_text', 'created_by', 'created_at', 'answer']
        read_only_fields = ['id', 'created_by', 'created_at']


