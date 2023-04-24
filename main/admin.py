from django.contrib import admin
from main.models import *

admin.site.register(DefaultTemplate)
admin.site.register(Meme)
admin.site.register(Like)
admin.site.register(Profile)
admin.site.register(Comment)
admin.site.register(FriendRequest)
admin.site.register(Message)