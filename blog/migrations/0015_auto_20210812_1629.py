# Generated by Django 3.2.6 on 2021-08-12 16:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0014_auto_20210812_1002'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='lv1_approver',
            field=models.IntegerField(default=-1),
        ),
        migrations.AddField(
            model_name='post',
            name='lv2_approver',
            field=models.IntegerField(default=-1),
        ),
        migrations.AddField(
            model_name='post',
            name='lv3_approver',
            field=models.IntegerField(default=-1),
        ),
    ]
