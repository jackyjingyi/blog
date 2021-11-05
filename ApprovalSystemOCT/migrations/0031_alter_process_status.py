# Generated by Django 3.2.6 on 2021-11-01 17:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0030_auto_20211029_0956'),
    ]

    operations = [
        migrations.AlterField(
            model_name='process',
            name='status',
            field=models.CharField(choices=[('1', '进行中'), ('2', '未开始'), ('3', '已结束'), ('4', '撤销'), ('5', '暂停'), ('6', '删除')], default='1', max_length=5),
        ),
    ]
