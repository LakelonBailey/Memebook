# Package Imports
from django.core.management.base import BaseCommand
from main.models import DefaultTemplate
from django.conf import settings
from django.core.files import File
from django.core.files.images import ImageFile
import os
from lib.memes import add_meme_text
from PIL import Image, ImageDraw, ImageFont
from memebook.settings import BASE_DIR

# Fun algorithm that you won't understand
class Command(BaseCommand):

    def handle(self, *args, **options):
        input_image_path = os.path.join(BASE_DIR, 'default_templates/disaster_girl.jpeg')
        top_text = 'They turned off todfshgl;dsnfhl;dnlhhe tv'
        bottom_text = top_text
        output_image_path = 'output.jpeg'
        add_meme_text(input_image_path, top_text, bottom_text, output_image_path)
