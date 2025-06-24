# courses/serializers.py
from rest_framework import serializers
from .models import Category, Course

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_name = serializers.CharField(write_only=True)

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'created_at', 'category', 'category_name']

    def create(self, validated_data):
        category_name = validated_data.pop('category_name').strip().lower()
        category, _ = Category.objects.get_or_create(name__iexact=category_name, defaults={'name': category_name})

        validated_data.pop('learner', None)
        learner = self.context['request'].user
        return Course.objects.create(learner=learner, category=category, **validated_data)
