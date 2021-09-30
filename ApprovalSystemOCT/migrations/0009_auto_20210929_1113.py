# Generated by Django 3.2.6 on 2021-09-29 11:13

import datetime
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0008_auto_20210929_1112'),
    ]

    operations = [
        migrations.CreateModel(
            name='Attachment',
            fields=[
                ('attachment_uuid', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('attachment_app_name', models.CharField(max_length=255)),
                ('attachment_app_model', models.CharField(max_length=255)),
                ('attachment_identify', models.CharField(default='', help_text='APPs model primary key for attachment', max_length=255)),
            ],
        ),
        migrations.AlterField(
            model_name='book',
            name='publish_date',
            field=models.DateTimeField(default=datetime.datetime(2021, 9, 29, 11, 13, 0, 867467)),
        ),
        migrations.AlterField(
            model_name='process',
            name='process_start_time',
            field=models.DateTimeField(default=datetime.datetime(2021, 9, 29, 11, 13, 0, 867467)),
        ),
    ]
