from __future__ import unicode_literals
import os
from main.models import *

# Django Imports
from django.core.management.base import BaseCommand
from django.db.models import Count, Case
from lib.sorting import sort_memes
import os
from time import time

class Command(BaseCommand):

    # Execute
    def handle(self, *args, **options):
        memes = Meme.objects.all()
        sort_memes(
            memes=memes,
            profile='Test',
            sorter='relevance'
        )