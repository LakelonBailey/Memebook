# Package Imports
from django.core.management.base import BaseCommand
from main.models import DefaultTemplate
from django.conf import settings
from django.core.files import File
from django.core.files.images import ImageFile
import os

# Fun algorithm that you won't understand
class Command(BaseCommand):

    def handle(self, *args, **options):
        default_templates_dir = os.path.join(settings.BASE_DIR, 'default_templates')

        for file_name in os.listdir(default_templates_dir):
            file_path = os.path.join(default_templates_dir, file_name)

            if os.path.isfile(file_path) and file_name.lower().endswith(('.jpg', '.jpeg')):
                slug_name = os.path.splitext(file_name)[0]

                # Check if a DefaultTemplate with the given slug_name exists
                template_exists = DefaultTemplate.objects.filter(slug_name=slug_name).exists()

                if not template_exists:
                    with open(os.path.join('default_templates', file_name), 'rb') as f:
                        default_template = DefaultTemplate(slug_name=slug_name)
                        django_file = File(f)
                        django_file.name = file_name
                        default_template.image = ImageFile(django_file, name=file_name)
                        default_template.save()
