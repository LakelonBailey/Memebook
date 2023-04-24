import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from main.models import Message, Profile
from memebook.serializers import MessageSerializer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.profile_id = self.scope['url_route']['kwargs']['profile_id']
        self.profile = await self.get_profile()
        self.room_name = f"chat_{self.profile_id}"
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        recipient_id = text_data_json['recipient_id']
        recipient = await self.get_profile(recipient_id)


        new_message = await self.create_message(self.user.profile, recipient, message)
        serialized_message = MessageSerializer(new_message).data
        content = {'message': serialized_message}

        await self.channel_layer.group_send(self.room_name, {'type': 'chat_message', 'message': content})

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({'message': message}))

    @database_sync_to_async
    def get_profile(self):
        return Profile.objects.get(uuid=self.profile_id)

    @database_sync_to_async
    def create_message(self, sender, recipient, text):
        message = Message(sender=sender, recipient=recipient, text=text)
        message.save()
        return message