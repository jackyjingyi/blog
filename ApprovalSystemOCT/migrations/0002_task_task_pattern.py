# Generated by Django 3.2.6 on 2021-11-24 16:11

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='task_pattern',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.DO_NOTHING, to='ApprovalSystemOCT.tasktype'),
            preserve_default=False,
        ),
    ]