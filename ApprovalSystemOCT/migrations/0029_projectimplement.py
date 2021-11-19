# Generated by Django 3.2.6 on 2021-10-28 10:26

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0028_alter_processtype_process_type'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProjectImplement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('project_important_issue', models.CharField(max_length=500, verbose_name='重点工作事项')),
                ('project_important_issue_number', models.IntegerField(default=0, verbose_name='重点工作事项编号')),
                ('project_task', models.CharField(max_length=255, verbose_name='分项任务')),
                ('project_task_seq', models.IntegerField(default=0, verbose_name='分项任务编号')),
                ('project_task_start_time', models.DateTimeField(blank=True, null=True, verbose_name='分项任务开展时间')),
                ('project_task_end_time', models.DateTimeField(blank=True, null=True, verbose_name='分项任务完成时间')),
                ('season_implement_progress', models.TextField(blank=True, null=True, verbose_name='本季度工作推进情况')),
                ('season_implement_delay_explanation', models.TextField(default='无', null=True, verbose_name='未能按计划进度完成的原因')),
                ('add_ups', models.TextField(blank=True, null=True, verbose_name='相关说明')),
                ('sponsor', models.CharField(blank=True, max_length=50, null=True, verbose_name='负责人')),
                ('department', models.CharField(max_length=255, verbose_name='责任单位/部门')),
                ('progress_year', models.CharField(max_length=20, verbose_name='编报年')),
                ('progress_season', models.CharField(max_length=20, verbose_name='编报季度')),
                ('create_time', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('update_time', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('project_base', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ApprovalSystemOCT.projectrequirement')),
            ],
        ),
    ]