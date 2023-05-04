from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/messages/<str:profile_id>/<str:recipient_id>/', consumers.ChatConsumer.as_asgi()),
]