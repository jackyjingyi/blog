# Generated by Django 3.2.6 on 2022-02-07 14:34

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0024_implementmaintask_implementsubtask'),
    ]

    operations = [
        migrations.AlterField(
            model_name='implementmaintask',
            name='base',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='main_tasks', to='ApprovalSystemOCT.projectimplementtitle'),
        ),
        migrations.AlterField(
            model_name='implementsubtask',
            name='base',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='subtasks', to='ApprovalSystemOCT.implementmaintask'),
        ),
        migrations.AddConstraint(
            model_name='projectimplementtitle',
            constraint=models.UniqueConstraint(fields=('project_base', 'progress_year', 'progress_season'), name='unique_progress'),
        ),
    ]
