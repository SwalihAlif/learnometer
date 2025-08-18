from django.db import models

# Create your models here.

class MotivationalQuote(models.Model):
    quote = models.TextField()
    author = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.quote[:50]
    

class MotivationalVideo(models.Model):
    title = models.CharField(max_length=255)
    youtube_url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    

from cloudinary.models import CloudinaryField

class MotivationalBook(models.Model):
    title = models.CharField(max_length=255)
    pdf_image = CloudinaryField('image', blank=True, null=True)  # preview
    pdf_file = CloudinaryField('pdf', resource_type='raw')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    

from django.db import models
from django.conf import settings

class AdminReview(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]  # 1 to 5 stars

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_reviews'
    )
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    review = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    is_visible = models.BooleanField(default=True)  # for admin moderation

    def __str__(self):
        return f"Review by {self.user.email} - {self.rating}⭐"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Admin Review"
        verbose_name_plural = "Admin Reviews"

class SiteSettings(models.Model):
    premium_price = models.DecimalField(max_digits=10, decimal_places=2, default=999.00)

    def __str__(self):
        return "Site Settings"
    
    class Meta:
        verbose_name_plural = "Site Settings"




