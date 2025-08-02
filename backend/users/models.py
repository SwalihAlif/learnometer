from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from cloudinary.models import CloudinaryField
import random
from datetime import timedelta
from django.utils import timezone

# Create your models here.
class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


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
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    is_premium = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        return getattr(self.user_profile, 'full_name', '') or self.email

    def get_full_name(self):
        return self.full_name

from django.contrib.auth import get_user_model
User = get_user_model()

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_profile')
    
    # Shared fields
    full_name = models.CharField(max_length=100)
    profile_picture = CloudinaryField('image', blank=True, null=True) 
    bio = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    preferred_categories = models.JSONField(blank=True, default=list)  # List of categories
    languages_known = models.JSONField(blank=True, default=list)       # List of languages
    learning_goals = models.TextField(blank=True, null=True)

    experience_years = models.PositiveIntegerField(blank=True, null=True)
    linkedin_profile = models.URLField(blank=True, null=True)
    portfolio_website = models.URLField(blank=True, null=True)
    availability_schedule = models.JSONField(blank=True, null=True)  # { day: {start, end}, ... }
    is_approved = models.BooleanField(default=False) # for mentor approval

    def __str__(self):
        return f"{self.user.email} Profile"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "User Profiles"


class OTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=5)
    
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = f"{random.randint(100000, 999999)}"
        super().save(*args, **kwargs)

