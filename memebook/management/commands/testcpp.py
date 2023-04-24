from __future__ import unicode_literals
import os
from main.models import *

# Django Imports
from django.core.management.base import BaseCommand
from django.db.models import Count, Case
from lib.memes import sort_memes
import os

class Command(BaseCommand):

    # Execute
    def handle(self, *args, **options):
        print('Getting memes...')
        memes = list(Meme.objects.all().annotate(
            like_count=Count('likes'),
        ))

        memes = sort_memes(memes)

        print('Printing result...')

        for meme in memes:
            print(meme)