from django.contrib import admin
from . models import MotivationalQuote, MotivationalBook, MotivationalVideo, AdminReview, SiteSettings

# Register your models here.
admin.site.register(MotivationalQuote)
admin.site.register(MotivationalBook)
admin.site.register(MotivationalVideo)
admin.site.register(AdminReview)
admin.site.register(SiteSettings)