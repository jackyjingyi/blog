import json
import uuid
from rest_framework import serializers
from ApprovalSystemOCT.models import Attachment, Process, Task, Step, Book, ProjectRequirement, ProcessType


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ("id", "book_name", "author", "publish_date", "update_time")


class StepSerializer(serializers.ModelSerializer):
    step_attachment_snapshot = serializers.JSONField(encoder=json.JSONEncoder)

    class Meta:
        model = Step
        fields = ("step_id", "task", "step_seq", "step_owner", "step_attachment_snapshot", "step_attachment")


class ProjectRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectRequirement
        fields = "__all__"


class ProcessTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessType
        fields = (
            "id", "process_name", "process_type", "process_start_time", "process_end_time",
            "process_creator", "process_executor")


class AttachmentSeriablizer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = "__all__"