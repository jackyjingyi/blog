# Generated by Django 3.2.6 on 2021-12-03 11:33

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ApprovalSystemOCT', '0007_auto_20211203_1115'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='projectrequirement',
            options={'permissions': (('patch_projectrequirement', '分发'), ('view_projectrequirement_submitted', '支持查看录入员已提交的课题需求'), ('view_projectrequirement_set_to_annual', '支持查看已经立项的年度课题需求'))},
        ),
    ]
