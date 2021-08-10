from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from datetime import datetime, date
from ckeditor.fields import RichTextField


class Category(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('home')


class Source(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('home')


class Post(models.Model):
    title = models.CharField(max_length=255)
    title_tag = models.CharField(max_length=255, default="title tag")
    author = models.ForeignKey(User, on_delete=models.PROTECT)
    body = RichTextField(verbose_name="", blank=True, null=True)
    post_date = models.DateField(auto_now_add=True)
    post_file = models.FileField(null=True, blank=True)
    category = models.CharField(max_length=255, default='旅游')
    source = models.CharField(max_length=255, default='大数据组')
    views = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.title + " | " + str(self.author)

    def get_absolute_url(self):
        return reverse('home')

    def increase_views(self):
        self.views += 1
        self.save(update_fields=['views'])