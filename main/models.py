from django.db import models
from lib.models import BaseClass
from django.contrib.auth.models import User


def format_slugname(slug_name):
    return " ".join(map(lambda word: word.capitalize(), slug_name.split('_')))


# Create your models here.
class DefaultTemplate(BaseClass):
    description = models.CharField(max_length=100, null=True, blank=True)
    slug_name = models.CharField(max_length=80, null=True, blank=True)
    name = models.CharField(max_length=80, null=True, blank=True)
    image = models.FileField()

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.slug_name = self.image.name.split('.')[0]
        self.name = format_slugname(self.slug_name)

        super(DefaultTemplate, self).save(*args, **kwargs)


class Profile(BaseClass):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='profile')
    first_name = models.CharField(max_length=15, null=True, blank=True)
    last_name = models.CharField(max_length=15, null=True, blank=True)
    friends = models.ManyToManyField('self', blank=True)
    is_private = models.BooleanField(default=True)
    liked_memes_privacy = models.CharField(default='Private', max_length=15, null=True, choices=(
        ('Private', 'Private'),
        ('Friends Only', 'Friends Only'),
        ('Public', 'Public'),
    ))

    def __str__(self):
        return self.full_name()

    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Meme(BaseClass):
    profile = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='memes')
    template = models.ForeignKey(DefaultTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name='memes')
    image = models.FileField()
    top_text = models.CharField(max_length=50, null=True)
    bottom_text = models.CharField(max_length=50, null=True)

    def __str__(self):
        return f"{str(self.profile)} - {str(self.template)}"

class Comment(BaseClass):
    profile = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='comments')
    meme = models.ForeignKey(Meme, on_delete=models.CASCADE, null=True, blank=True, related_name='comments')
    text = models.CharField(max_length=300, null=True, blank=True)

class Like(BaseClass):
    profile = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='likes')
    meme = models.ForeignKey(Meme, on_delete=models.CASCADE, null=True, blank=True, related_name='likes')

    def __str__(self):
        return f"{self.profile.full_name()} liked {str(self.meme)}"

class FriendRequest(BaseClass):
    requester = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_requests')
    requestee = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_requests')

    def __str__(self):
        return f"{self.requester.full_name()} requested {self.requestee.full_name()}"

    def fullfill(self):
        self.requester.friends.add(self.requestee)
        self.requester.save()
        self.delete()

class Message(BaseClass):
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='received_messages')
    text = models.TextField()
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender.full_name()} -> {self.recipient.full_name()}: {self.text}"

