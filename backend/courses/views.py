from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Course, Category
from .serializers import CourseSerializer, CategorySerializer
from .trie import CategoryTrie

class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Course.objects.filter(learner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(learner=self.request.user)  

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class CategorySuggestionView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.GET.get('q', '')
        trie = CategoryTrie()
        for cat in Category.objects.all():
            trie.insert(cat.name)
        suggestions = trie.starts_with(query)
        return Response(suggestions)



