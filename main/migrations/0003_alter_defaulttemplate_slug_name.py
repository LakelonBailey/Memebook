# Generated by Django 3.2.15 on 2023-03-28 18:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0002_auto_20230328_1803'),
    ]

    operations = [
        migrations.AlterField(
            model_name='defaulttemplate',
            name='slug_name',
            field=models.CharField(blank=True, max_length=80, null=True),
        ),
    ]
