# Generated by Django 3.2.6 on 2021-08-17 10:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0018_poststatus_chinese_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='title',
            field=models.CharField(max_length=255, verbose_name='标题'),
        ),
    ]
