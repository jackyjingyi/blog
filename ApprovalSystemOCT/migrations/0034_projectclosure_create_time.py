# Generated by Django 3.2.6 on 2022-02-26 11:07

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0033_auto_20220226_1103'),
    ]

    operations = [
        migrations.AddField(
            model_name='projectclosure',
            name='create_time',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now, verbose_name='创建时间'),
            preserve_default=False,
        ),
    ]
