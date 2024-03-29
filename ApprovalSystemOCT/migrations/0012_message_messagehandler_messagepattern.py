# Generated by Django 3.2.6 on 2021-12-15 14:47

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('ApprovalSystemOCT', '0011_alter_process_process_leader'),
    ]

    operations = [
        migrations.CreateModel(
            name='MessagePattern',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message_type', models.CharField(choices=[('1', '审批通知'), ('2', '抄送信息'), ('3', '通知信息')], max_length=25, verbose_name='消息类型')),
                ('body', models.TextField(verbose_name='消息主体')),
            ],
        ),
        migrations.CreateModel(
            name='MessageHandler',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('step_create_time', models.DateTimeField(auto_now_add=True)),
                ('step_update_time', models.DateTimeField(auto_now=True)),
                ('start_time', models.DateTimeField(blank=True, null=True)),
                ('due_time', models.DateTimeField(blank=True, null=True)),
                ('status', models.CharField(max_length=25, verbose_name='状态')),
                ('comments', models.CharField(max_length=500, verbose_name='备注')),
                ('url', models.URLField(max_length=255, verbose_name='处理链接')),
                ('inform', models.ManyToManyField(related_name='informed_people', to=settings.AUTH_USER_MODEL)),
                ('receive', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, related_name='receive_person', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='消息标题')),
                ('body', models.TextField(verbose_name='消息主体')),
                ('url', models.URLField(max_length=255, verbose_name='处理链接')),
                ('pattern', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='message_pattern', to='ApprovalSystemOCT.messagepattern')),
            ],
        ),
    ]
