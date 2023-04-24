from rest_framework import serializers
from .models import Profile, Message


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('uuid', 'first_name', 'last_name')


class MessageSerializer(serializers.ModelSerializer):
    sender = ProfileSerializer()
    recipient = ProfileSerializer()

    class Meta:
        model = Message
        fields = ('uuid', 'sender', 'recipient', 'text', 'is_read', 'created_at')
