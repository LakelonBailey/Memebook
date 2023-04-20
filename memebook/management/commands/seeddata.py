from __future__ import unicode_literals
import os
import sys
from io import StringIO
import subprocess
from main.models import *
import names

# Django Imports
from django.core.management.base import BaseCommand
from django.core.management import call_command
from essential_generators import DocumentGenerator
from random import randint, shuffle
from django.db import transaction

from lib.memes import create_meme


gen = DocumentGenerator()
gen.init_word_cache(5000)
gen.init_sentence_cache(5000)

PROFILE_TOTAL = 50
MEME_LIMIT = 20
COMMENT_LIMIT = 30
LIKE_LIMIT = PROFILE_TOTAL - 1


def manage(*args):
    return ['python', 'manage.py', *args]

class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument(
            '--delete-old',
            action='store_true',
            default=False,
            help='Delete all previous profiles, memes, likes, comments, and default templates'
        )

    # Execute
    def handle(self, *args, **options):

        if options['delete_old']:
            print('Deleting previous profiles, memes, likes, comments, and default templates...')
            Profile.objects.all().delete()
            Meme.objects.all().delete()
            DefaultTemplate.objects.all().delete()

            print('Deleting all media files...')
            call_command('clearmediafiles')

        print('Loading default templates...')
        call_command('loaddefaults')

        default_templates = list(DefaultTemplate.objects.all())
        num_defaults = len(default_templates)

        profiles = []
        print('Creating Profiles...')
        for _ in range(PROFILE_TOTAL):
            profile = Profile.objects.create(
                first_name=names.get_first_name(),
                last_name=names.get_last_name(),
                is_private=bool(randint(0, 1)),
            )
            profiles.append(profile)

        comments = []
        likes = []
        for i in range(len(profiles)):
            remaining_profiles = profiles.copy()
            profile = remaining_profiles.pop(i)
            shuffle(remaining_profiles)
            num_memes = randint(1, MEME_LIMIT)

            print(f'Creating {num_memes} memes for Profile #{i + 1}')
            for meme_idx in range(num_memes):
                meme_number = meme_idx + 1
                template = default_templates[randint(0, num_defaults - 1)]
                top_text = " ".join([gen.word() for _ in range(randint(3, 8))])
                bottom_text = " ".join([gen.word() for _ in range(randint(3, 8))])

                print(f'    Creating meme #{meme_number}')
                new_meme = create_meme(
                    profile,
                    {
                        'top_text': top_text[:50],
                        'bottom_text': bottom_text[:50],
                        'template_slug': template.slug_name
                    }
                )

                num_likes = randint(0, LIKE_LIMIT)
                print(f'        Creating {num_likes} likes for meme #{meme_number}')
                for j in range(num_likes):
                    profile_for_like = remaining_profiles[j]
                    likes.append(Like(
                        meme=new_meme,
                        profile=profile_for_like
                    ))

                num_comments = randint(0, COMMENT_LIMIT)
                print(f'        Creating {num_comments} comments for meme #{meme_number}')
                for j in range(num_comments):
                    comments.append(Comment(
                        meme=new_meme,
                        profile=profiles[randint(0, PROFILE_TOTAL - 1)],
                        text=gen.sentence()[:300]
                    ))

        chunk_size = 300
        print(f'Bulk Creating {len(likes)} likes...')
        with transaction.atomic():
            for i in range(0, len(likes), chunk_size):
                Like.objects.bulk_create(likes[i:i + chunk_size])

        print(f'Bulk Creating {len(comments)} comments...')
        with transaction.atomic():
            for i in range(0, len(comments), chunk_size):
                Comment.objects.bulk_create(comments[i:i + chunk_size])

