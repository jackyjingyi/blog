# Generated by Django 3.2.6 on 2021-11-26 10:22

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0002_task_task_pattern'),
    ]

    operations = [
        migrations.RenameField(
            model_name='process',
            old_name='creat_time',
            new_name='create_time',
        ),
        migrations.AlterField(
            model_name='step',
            name='step_attachment',
            field=models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, related_name='attachments', to='ApprovalSystemOCT.attachment'),
        ),
        migrations.AlterField(
            model_name='step',
            name='task',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='steps', to='ApprovalSystemOCT.task'),
        ),
        migrations.AlterField(
            model_name='task',
            name='process',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='ApprovalSystemOCT.process'),
        ),
    ]