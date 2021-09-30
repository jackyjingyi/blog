# Generated by Django 3.2.6 on 2021-09-29 10:15

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0003_alter_process_process_start_time'),
    ]

    operations = [
        migrations.CreateModel(
            name='Book',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('book_name', models.CharField(max_length=255)),
                ('author', models.CharField(max_length=255)),
                ('publish_date', models.DateTimeField(default=datetime.datetime(2021, 9, 29, 10, 15, 55, 859804))),
            ],
        ),
        migrations.AlterField(
            model_name='process',
            name='process_start_time',
            field=models.DateTimeField(default=datetime.datetime(2021, 9, 29, 10, 15, 55, 859804)),
        ),
    ]