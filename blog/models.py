from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from datetime import datetime, date


class Category(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('home')


class Post(models.Model):
    title = models.CharField(max_length=255)
    title_tag = models.CharField(max_length=255, default="title tag")
    author = models.ForeignKey(User, on_delete=models.PROTECT)
    body = models.TextField()
    post_date = models.DateField(auto_now_add=True)
    post_file = models.FileField()
    category = models.CharField(max_length=255, default='旅游')

    def __str__(self):
        return self.title + " | " + str(self.author)

    def get_absolute_url(self):
        return reverse('home')
