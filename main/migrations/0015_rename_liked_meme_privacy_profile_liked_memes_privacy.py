# Generated by Django 4.0.4 on 2023-04-18 18:07

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0014_remove_profile_private_liked_memes_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='profile',
            old_name='liked_meme_privacy',
            new_name='liked_memes_privacy',
        ),
    ]
