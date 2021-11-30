import json
import uuid
from rest_framework import serializers
from ApprovalSystemOCT.models import Attachment, Process, Task, Step, Book, ProjectRequirement, ProcessType, \
    ProjectImplementTitle


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ("id", "book_name", "author", "publish_date", "update_time")


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


class AttachmentSerializer(serializers.ModelSerializer):
    attrs = serializers.StringRelatedField(source="get_attachment", read_only=True)

    class Meta:
        model = Attachment
        fields = "__all__"


class StepSerializer(serializers.ModelSerializer):
    step_attachment_snapshot = serializers.JSONField(encoder=json.JSONEncoder)

    class Meta:
        model = Step
        fields = (
            "step_id", "task", "step_seq", "step_owner", "step_attachment_snapshot", "step_attachment", "step_status",

        )


class TaskSerializer(serializers.ModelSerializer):
    steps = StepSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = "__all__"

    def to_representation(self, instance):
        response = super().to_representation(instance)
        response["steps"] = sorted(response["steps"], key=lambda x: x["step_seq"])
        return response


class ProcessSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    process_owner = serializers.StringRelatedField(source="get_owner_name", read_only=True)
    current_status = serializers.StringRelatedField(source="get_current_status", read_only=True)
    target_detail = serializers.HyperlinkedIdentityField(view_name="project_detail")

    class Meta:
        model = Process
        fields = "__all__"
        # depth = 1

    def to_representation(self, instance):
        response = super().to_representation(instance)
        response["tasks"] = sorted(response["tasks"], key=lambda x: x["task_seq"])
        return response


class ProjectImplementTitleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImplementTitle
        fields = (
            "project_base", "sponsor", "department", "progress_year", "progress_season"
        )
