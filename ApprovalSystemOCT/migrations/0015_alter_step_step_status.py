# Generated by Django 3.2.6 on 2021-12-15 16:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0014_process_process_state'),
    ]

    operations = [
        migrations.AlterField(
            model_name='step',
            name='step_status',
            field=models.CharField(default='3', max_length=255, verbose_name='执行状态'),
        ),
    ]