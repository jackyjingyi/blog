import uuid
import logging

import django.db.models
from django.db import models
from django.contrib.auth.models import User
from django.apps import apps
from django.core import serializers
import django.utils.timezone as timezone
from datetime import datetime, date, timedelta


class Book(models.Model):
    book_name = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    publish_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.book_name} by {self.author} on {self.publish_date.strftime('%Y-%m-%d')}"


class Attachment(models.Model):
    attachment_uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attachment_app_name = models.CharField(max_length=255)
    attachment_app_model = models.CharField(max_length=255)
    attachment_identify = models.CharField(max_length=255, help_text="APPs model primary key for attachment",
                                           default="")

    def get_attachment(self):
        return apps.get_model(self.attachment_app_name, self.attachment_app_model).objects.filter(
            pk=self.attachment_identify)


class Process(models.Model):
    process_order_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                                        help_text="create an uuid for each order")

    process_description = models.TextField("流程描述")
    process_name = models.CharField("流程名称", max_length=255)
    process_pattern = models.CharField("流程模板", max_length=255)
    process_type = models.CharField("流程类型", max_length=255)
    process_sponsor = models.ForeignKey(User, on_delete=models.CASCADE)

    process_init_time = models.DateTimeField(auto_now_add=True)
    process_update_time = models.DateTimeField(auto_now=True)
    process_start_time = models.DateTimeField(default=timezone.now)
    process_duration = models.DurationField("持续时长", help_text="流程持续天数", null=True)
    process_end_date = models.DateTimeField(null=True, blank=True)

    # process_readonly_sponsors = models.CharField(max_length=255)  TODO: 添加流程只读干系人（群） [pk1, pk2]
    # process_administrator = models.CharField(max_length=255)    TODO: 流程管理员（群组)

    def assign_end_date(self, days, timestamp):
        if self.process_duration:
            self.process_end_date = self.process_start_time + self.process_duration
        else:
            if any([days is not None, timestamp is not None]):
                try:
                    self.process_end_date = self.process_start_time + timedelta(days)
                except TypeError:
                    self.process_end_date = timestamp
            else:
                # all None
                logging.warning("At least provide one parameter assigning process end date")

    def __str__(self):
        return f"id:{self.process_order_id}, name : {self.process_name}, descriptiong: {self.process_description}"


class Task(models.Model):
    # A process include many moves,
    # A move include many steps,
    # A move is defines seq oder of steps
    # 串联 step1 => step2
    process = models.ForeignKey(Process, on_delete=models.CASCADE)
    task_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                               help_text="create an uuid for each Task")
    task_type = models.CharField("动作类型", max_length=255)
    task_seq = models.IntegerField("动作顺序", default=0)
    task_status = models.CharField("执行状态", max_length=255)  # 挂起pending, 执行中processing, 等待awaiting
    task_state = models.CharField("动作状态", max_length=255)  # 通过approval、驳回deny、撤回withdraw、放弃abandon、转出patch out
    task_sponsor = models.ForeignKey(User, on_delete=models.CASCADE)

    @classmethod
    def get_tasks(cls, process_id):
        return cls.objects.filter(process_id=process_id).order_by('task_seq')

    def __str__(self):
        return f"TaskID: {self.task_id}, ProcessID: {self.process}"


class Step(models.Model):
    step_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                               help_text="create an uuid for each STEP")
    task = models.ForeignKey(Task, on_delete=models.CASCADE)

    step_seq = models.IntegerField('步骤顺序', default=0)
    # 1. conjunction: all previous step must be pass to reach this step
    # 2. single: at least one previous step pass
    # 3. null: the first step
    step_condition_type = models.CharField("前置要求", null=True, blank=True, max_length=255)
    step_condition = models.JSONField("前置要求", null=True, blank=True)
    step_owner = models.CharField("执行人", max_length=255)
    step_assigner = models.CharField("转发发出人", max_length=255, null=True, blank=True)
    step_assignee = models.CharField("转出给", max_length=255, null=True, blank=True)

    step_create_time = models.DateTimeField(auto_now_add=True)
    step_update_time = models.DateTimeField(auto_now=True)
    step_start_time = models.DateTimeField(null=True, blank=True)
    step_duration = models.DurationField(default=timedelta(seconds=0))
    step_end_time = models.DateTimeField(null=True, blank=True)

    step_status = models.CharField("执行状态", max_length=255)  # 挂起pending, 执行中processing, 等待awaiting
    step_state = models.CharField("步骤状态", max_length=255)  # 通过approval、驳回deny、撤回withdraw、放弃abandon、转出patch out

    step_type = models.CharField("步骤类型", max_length=255)  # 1. 录入 input  2. 审批 approval 3. 修订 edit 4. 合并 5. 删减 6. 新增
    step_attachment = models.ForeignKey(Attachment, on_delete=models.CASCADE, default=None)
    step_attachment_snapshot = models.JSONField(null=True,
                                                blank=True)  # store attachment snapshot cloud be forms { id: 21, title:"love story"}

    def set_condition(self, step_id=None):
        pass

    def get_condition(self):
        pass

    def set_attachment_snapshot(self):
        _z = serializers.serialize('json', self.step_attachment.get_attachment())
        print(_z)
        self.step_attachment_snapshot = _z
        self.save()

    def get_next_step(self):
        try:
            _next_instance = self.__class__.objects.filter(task_id=self.task_id, step_seq__gte=self.step_seq,
                                                           step_update_time__gt=self.step_update_time).order_by(
                'step_update_time').first()
            return _next_instance
        except models.ObjectDoesNotExist:
            return self.__class__.objects.none()

    @classmethod
    def get_steps(cls, task_id):
        return cls.objects.filter(task_id=task_id).order_by('step_seq').order_by('step_create_time')

    @classmethod
    def display_steps(cls, task_id):
        query_set = cls.objects.filter(task__task_id=task_id).order_by('step_seq')
        if query_set:
            seq = 0
            num = 0
            _z = "<ul>"
            while num < query_set.count():
                point = query_set[num]
                if query_set[num].step_seq == seq:
                    display = f"{point}, seq:{seq}, status: {point.step_status}"
                    _z += "<li>" + display + "</li>"
                    num += 1
                else:
                    seq += 1
            _z += "</ul>"
            return _z
        else:
            logging.info("TaskID does not match any Steps.")
            return "TaskID does not match any Steps."

    def __str__(self):
        return f"stepid: {self.step_id}, taskid :{self.task_id}"


class Action(models.Model):
    pass


class State(models.Model):
    # recording states for an order
    pass
