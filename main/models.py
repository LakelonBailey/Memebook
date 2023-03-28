from django.db import models
from lib.models import BaseClass
from django.contrib.auth.models import User
import uuid


def format_slugname(slug_name):
    return " ".join(map(lambda word: word.capitalize(), slug_name.split('_')))


# Create your models here.
class DefaultTemplate(BaseClass):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
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

class Comment(BaseClass):
    profile = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='comments')
    meme = models.ForeignKey(Meme, on_delete=models.CASCADE, null=True, blank=True, related_name='comments')
    text = models.CharField(max_length=100, null=True, blank=True)

class Like(BaseClass):
    profile = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='likes')
    meme = models.ForeignKey(Meme, on_delete=models.CASCADE, null=True, blank=True, related_name='likes')
