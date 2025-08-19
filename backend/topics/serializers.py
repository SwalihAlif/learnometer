from rest_framework import serializers
from .models import MainTopic, SubTopic, Question, Answer, Schedule

class MainTopicSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField()
    class Meta:
        model = MainTopic
        fields = ['id', 'course', 'title', 'description', 'created_at', 'created_by', 'course_title',]

        read_only_fields = ['created_by']
    def get_course_title(self, obj):
        return obj.course.title if obj.course else None

# serializers.py

class SubTopicSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = SubTopic
        fields = ['id', 'main_topic', 'title', 'description', 'created_at', 'completed', 'created_by']



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




class ScheduleSerializer(serializers.ModelSerializer):
    topic_title = serializers.CharField(source='topic.title', read_only=True)

    class Meta:
        model = Schedule
        fields = ['id', 'topic', 'topic_title', 'date', 'start_time', 'end_time']
        read_only_fields = ['id', 'topic_title']

