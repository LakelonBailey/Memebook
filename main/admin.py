from django.contrib import admin
from main.models import (
    Profile,
    Comment,
    Like,
    Meme,
    DefaultTemplate
)

admin.site.register(DefaultTemplate)
admin.site.register(Meme)
admin.site.register(Like)
admin.site.register(Profile)
admin.site.register(Comment)