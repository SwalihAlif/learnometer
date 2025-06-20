from django.db import models

# Create your models here.
class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


from django.db import models
from cloudinary.models import CloudinaryField
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    # Shared fields
    full_name = models.CharField(max_length=100)
    profile_picture = CloudinaryField('image', blank=True, null=True)
    bio = models.TextField(blank=True)
    contact_number = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Learner-specific fields
    preferred_categories = models.JSONField(blank=True, default=list)  # List of categories
    languages_known = models.JSONField(blank=True, default=list)       # List of languages
    learning_goals = models.TextField(blank=True)

    # Mentor-specific fields
    experience_years = models.PositiveIntegerField(blank=True, null=True)
    linkedin_profile = models.URLField(blank=True)
    portfolio_website = models.URLField(blank=True)
    availability_schedule = models.JSONField(blank=True, null=True)  # { day: {start, end}, ... }

    def __str__(self):
        return f"{self.user.email} Profile"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "User Profiles"


