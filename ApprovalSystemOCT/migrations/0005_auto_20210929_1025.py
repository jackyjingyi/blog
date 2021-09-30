# Generated by Django 3.2.6 on 2021-09-29 10:25

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0004_auto_20210929_1015'),
    ]

    operations = [
        migrations.AlterField(
            model_name='book',
            name='publish_date',
            field=models.DateTimeField(default=datetime.datetime(2021, 9, 29, 10, 25, 24, 273338)),
        ),
        migrations.AlterField(
            model_name='process',
            name='process_start_time',
            field=models.DateTimeField(default=datetime.datetime(2021, 9, 29, 10, 25, 24, 273338)),
        ),
        migrations.AlterField(
            model_name='step',
            name='step_attachment_snapshot',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='step',
            name='step_condition',
            field=models.JSONField(blank=True, null=True, verbose_name='前置要求'),
        ),
    ]