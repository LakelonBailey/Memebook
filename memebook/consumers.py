import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from main.models import Message, Profile
from memebook.serializers import MessageSerializer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.profile_id = self.scope['url_route']['kwargs']['profile_id']
        self.recipient_id = self.scope['url_route']['kwargs']['recipient_id']
        sorted_ids = sorted([self.profile_id, self.recipient_id])
        self.room_name = f"chat_{'_'.join(sorted_ids)}"
        print('ROOM NAME:', self.room_name)

        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data['action']
        if action == 'message':
            message = data['message']
            recipient_id = data['recipient_id']


            new_message = await self.create_message(self.profile_id, recipient_id, message)
            serialized_message = MessageSerializer(new_message).data


            await self.channel_layer.group_send(self.room_name, {'type': 'chat_message', 'message': serialized_message})
        elif action == 'start_typing':
            typer_id = data['typer_id']
            await self.channel_layer.group_send(self.room_name,{
                'type': 'start_typing',
                'typer_id': typer_id
            })
        elif action == 'stop_typing':
            typer_id = data['typer_id']
            await self.channel_layer.group_send(self.room_name,{
                'type': 'stop_typing',
                'typer_id': typer_id
            })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def start_typing(self, event):
        await self.send(text_data=json.dumps(event))

    async def stop_typing(self, event):
        await self.send(text_data=json.dumps(event))


    @database_sync_to_async
    def get_profile(self, profile_id=None):
        profile_id = self.profile_id if profile_id is None else profile_id
        return Profile.objects.get(uuid=self.profile_id)

    @database_sync_to_async
    def create_message(self, sender_id, recipient_id, text):
        return Message.objects.create(
            sender=Profile.objects.filter(uuid=sender_id).first(),
            recipient=Profile.objects.filter(uuid=recipient_id).first(),
            text=text
        )