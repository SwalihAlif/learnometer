from django.db import models

# Create your models here.

class AdminNotification(models.Model):
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return self.message[:50]



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



