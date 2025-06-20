from django.contrib import admin
from .models import User, Role, UserProfile

# Register your models here.
admin.site.register(Role)
admin.site.register(User)
admin.site.register(UserProfile)