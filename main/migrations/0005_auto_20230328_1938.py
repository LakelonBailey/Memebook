# Generated by Django 3.2.15 on 2023-03-28 19:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0004_alter_defaulttemplate_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='meme',
            name='bottom_text',
            field=models.CharField(max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='meme',
            name='top_text',
            field=models.CharField(max_length=50, null=True),
        ),
    ]
