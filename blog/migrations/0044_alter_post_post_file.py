# Generated by Django 3.2.6 on 2022-02-07 14:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0043_alter_post_post_file'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='post_file',
            field=models.FileField(upload_to='uploadPosts/2022/2/', verbose_name='上传文件'),
        ),
    ]
