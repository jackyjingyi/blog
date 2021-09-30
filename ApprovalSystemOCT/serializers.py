import uuid
from rest_framework import serializers
from ApprovalSystemOCT.models import Attachment, Process, Task, Step, Book


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ("id", "book_name", "author", "publish_date")
