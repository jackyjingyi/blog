# Generated by Django 3.2.6 on 2022-03-15 16:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0045_alter_post_oa_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='post_file',
            field=models.FileField(upload_to='uploadPosts/2022/3/', verbose_name='上传文件'),
        ),
    ]
