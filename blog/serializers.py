import json
import uuid
from rest_framework import serializers
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ("id", "title", "body", "post_file", "category", "subcategory")


class PostEndProcessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ("id", "oa_status", "group_article_link")
