from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from django.urls import re_path
from memebook import consumers
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "memebook.settings")

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