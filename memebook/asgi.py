import os
from django.core.asgi import get_asgi_application
from django.urls import path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from memebook import consumers
from django.urls import re_path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'memebook.settings')

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AuthMiddlewareStack(
            URLRouter([
                re_path(r'ws/messages/(?P<profile_id>\w+)/$', consumers.ChatConsumer.as_asgi()),
            ])
        ),
    }
)