# Generated by Django 3.2.6 on 2021-11-29 17:01

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0003_auto_20211126_1022'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='process',
            options={'permissions': (('pack_up', 'Pack up'),)},
        ),
    ]
