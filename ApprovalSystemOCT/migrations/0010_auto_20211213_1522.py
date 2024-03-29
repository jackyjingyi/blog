# Generated by Django 3.2.6 on 2021-12-13 15:22

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('ApprovalSystemOCT', '0009_alter_projectrequirement_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='process',
            name='process_leader',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.DO_NOTHING, related_name='leader', to='auth.user'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='processtype',
            name='process_type',
            field=models.CharField(choices=[('0', '未选择'), ('1', '需求录入'), ('2', '年度课题管理')], max_length=255, verbose_name='流程类型'),
        ),
    ]
