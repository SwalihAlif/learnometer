from django.contrib import admin
from . models import AdminNotification, MotivationalQuote, MotivationalBook, MotivationalVideo

# Register your models here.
admin.site.register(AdminNotification)
admin.site.register(MotivationalQuote)
admin.site.register(MotivationalBook)
admin.site.register(MotivationalVideo)