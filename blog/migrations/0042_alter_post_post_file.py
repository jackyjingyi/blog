# Generated by Django 3.2.6 on 2021-09-28 18:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0041_alter_post_oa_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='post_file',
            field=models.FileField(upload_to='uploadPosts/2021/9/', verbose_name='上传文件'),
        ),
    ]