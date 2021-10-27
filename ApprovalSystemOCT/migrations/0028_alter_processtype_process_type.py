# Generated by Django 3.2.6 on 2021-10-27 17:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0027_alter_process_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='processtype',
            name='process_type',
            field=models.CharField(choices=[('0', '未选择'), ('1', '课题录入'), ('2', '课题修改'), ('3', '进度录入'), ('4', '成果录入'), ('5', '结题'), ('6', '资料上传')], max_length=255, verbose_name='流程类型'),
        ),
    ]
