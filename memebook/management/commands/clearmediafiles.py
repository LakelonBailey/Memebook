from __future__ import unicode_literals
import os
import sys
from main.models import *

# Django Imports
from django.core.management.base import BaseCommand
from memebook.settings import (
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_STORAGE_BUCKET_NAME,
    LOCAL,
    MEDIA_ROOT
)
import os
import shutil
import boto3

class Command(BaseCommand):

    # Execute
    def handle(self, *args, **options):
        if False:
            # Remove the local media folder and its contents
            if os.path.exists(MEDIA_ROOT):
                shutil.rmtree(MEDIA_ROOT)

            os.makedirs(MEDIA_ROOT)

        else:
            # Initialize a boto3 session with your AWS credentials
            session = boto3.Session(
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            )

            # Create a resource for the S3 service
            s3 = session.resource('s3')
            bucket = s3.Bucket(AWS_STORAGE_BUCKET_NAME)

            # Define the prefix for the media folder
            media_folder_prefix = 'media/'

            print('Deleting AWS S3 Bucket Items')
            for obj in bucket.objects.filter(Prefix=media_folder_prefix):
                obj.delete()