# Generated by Django 3.2.6 on 2021-09-28 18:43

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='process',
            name='process_start_time',
            field=models.DateTimeField(default=datetime.datetime(2021, 9, 28, 18, 43, 13, 999722)),
        ),
    ]