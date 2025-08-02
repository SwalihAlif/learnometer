from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, CategoryViewSet, CategorySuggestionView


router = DefaultRouter()
router.register(r'', CourseViewSet, basename='courses')
router.register(r'categories', CategoryViewSet, basename='categories')

urlpatterns = [
    path('category-suggestions/', CategorySuggestionView.as_view(), name='category-suggestions'),
    path('', include(router.urls)),  
    
]
