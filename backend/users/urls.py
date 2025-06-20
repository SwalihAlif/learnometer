from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import MyTokenObtainPairView 
from users.views import RegisterMentorView, RegisterLearnerView



urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'), # login
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # refresh token
    path('register/mentor/', RegisterMentorView.as_view(), name='register_mentor'),
    path('register/learner/', RegisterLearnerView.as_view(), name='register_learner'),

]
