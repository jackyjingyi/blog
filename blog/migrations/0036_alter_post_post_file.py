# Generated by Django 3.2.6 on 2021-08-30 12:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0035_auto_20210826_0957'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='post_file',
            field=models.FileField(upload_to='C:\\Users\\Jack\\PycharmProjects\\django_blog\\media\\uploadPosts/2021/8/', verbose_name='上传文件'),
        ),
    ]
