import json
import uuid
import logging

import django.db.models
from django.db import models
from django.contrib.auth.models import User
from django.apps import apps
from django.core import serializers
import django.utils.timezone as timezone
from datetime import datetime, date, timedelta

PROJECT_TYPE = [
    ('0', '未选择'), ('1', '创新前瞻性研究'), ('2', '产品标准化研究'), ('3', '产品创新研究')
]
PROJECT_RESEARCH_DIRECTION = [
    ('0', '未选择'), ('1', '新型城镇化'), ('2', '文化&品牌'), ('3', '主题公园&新场景'), ('4', '新商业'), ('5', '产品管理'), ('6', '旅游大数据'),
    ('7', '康旅'), ('8', '创新投'), ('9', '其他')
]
PROJECT_REQUIREMENT_VERBOSE = {
    'project_name': '研究项目',
    "project_type": "课题类型",
    "project_research_direction": "研究方向",
    "project_department": "需求单位",
    "project_department_sponsor": "需求单位联系人",
    "project_department_phone": "联系电话",
    "project_co_group": "联合工作小组成员及分工",
    "project_research_funding": "研究经费",
    "project_outsourcing_funding": "外协预算",
    "project_start_time": "研究实施计划时间（起）",
    "project_end_time": "研究实施计划时间（止）",
    "project_detail": "具体分项任务内容及安排",
    "project_purpose": "主要创新研究课题内容、目标及意义",
    "project_preparation": "与课题相关的前期工作情况，现有基础条件",
    "project_difficult": "研究课题的重点及难点"
}

PROCESS_TYPE = [
    ('0', '未选择'), ('1', '课题录入'), ('2', '课题修改'), ('3', '进度录入')
]


def snapshot_default():
    return {}


class Role(models.Model):
    pass


class Group(models.Model):
    pass


class ProjectRequirement(models.Model):
    class Meta:
        permissions = (
            ('patch_requirement', 'can patch requirement'),
        )

    project_name = models.CharField("研究项目", max_length=255)
    project_type = models.CharField("课题类型", choices=PROJECT_TYPE, max_length=25,
                                    help_text="0.未选择,1.创新前瞻性研究；2.产品标准化研究，3.产品创新研究", default="0")
    project_research_direction = models.CharField("研究方向", max_length=25, choices=PROJECT_RESEARCH_DIRECTION,
                                                  help_text="0.未选择,1.新型城镇化；2.文化&品牌；3.主题公园&新场景；4.新商业；5.产品管理；6.旅游大数据；7.康旅；8.创新投；9.其他",
                                                  default="0")
    project_department = models.CharField("需求单位", max_length=255, default="")
    project_department_sponsor = models.CharField("需求单位联系人", max_length=25, default="")
    project_department_phone = models.CharField("联系电话", max_length=50, default="")
    project_co_group = models.TextField("联合工作小组成员及分工", default="")
    project_research_funding = models.CharField("研究经费", max_length=255, default="")
    project_outsourcing_funding = models.CharField("外协预算", max_length=255, default="")
    project_start_time = models.DateTimeField("研究实施计划时间（起）", null=True)
    project_end_time = models.DateTimeField("研究实施计划时间（止）", null=True)
    project_detail = models.TextField("具体分项任务内容及安排", default="")
    project_purpose = models.TextField("主要创新研究课题内容、目标及意义", default="")
    project_preparation = models.TextField("与课题相关的前期工作情况，现有基础条件", default="")
    project_difficult = models.TextField("研究课题的重点及难点", default="")

    def __str__(self):
        return f"研究项目: {self.project_name}"


class Book(models.Model):
    class Meta:
        permissions = (
            ('can_publish_book', u'发布图书'),
            ('can_repeal', u'撤销发布')
        )

    book_name = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    publish_date = models.DateTimeField(default=timezone.now)
    update_time = models.DateTimeField(auto_now=True)

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


class ProcessType(models.Model):
    process_name = models.CharField("流程名称", max_length=255)
    # process_pattern = models.CharField("流程模板", max_length=255)
    process_type = models.CharField("流程类型", choices=PROJECT_TYPE, max_length=255)
    process_creator = models.ForeignKey(User, on_delete=models.CASCADE)
    process_executor = models.ManyToManyField(User, related_name='executors')
    process_init_time = models.DateTimeField(auto_now_add=True)
    process_update_time = models.DateTimeField(auto_now=True)
    process_start_time = models.DateTimeField(default=timezone.now)
    process_duration = models.DurationField("持续时长", help_text="流程持续天数", null=True)
    process_end_time = models.DateTimeField(null=True, blank=True)


class Process(models.Model):
    process_order_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                                        help_text="create an uuid for each order")
    process_pattern = models.ForeignKey(ProcessType, on_delete=models.CASCADE)
    process_executor = models.ForeignKey(User, on_delete=models.CASCADE)
    creat_time = models.DateTimeField(auto_now_add=True)

    # process_readonly_sponsors = models.CharField(max_length=255)  TODO: 添加流程只读干系人（群） [pk1, pk2]
    # process_administrator = models.CharField(max_length=255)    TODO: 流程管理员（群组)

    def get_tasks(self):
        return Task.get_tasks(self.process_order_id)

    def create_task(self, **kwargs):
        kwargs['process_id'] = self.process_order_id
        return Task.objects.create(**kwargs)


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
    task_status = models.CharField("执行状态", max_length=255)  # 挂起pending, 执行中processing, 等待awaiting,完成finish
    task_state = models.CharField("动作状态", max_length=255)  # 通过approval、驳回deny、撤回withdraw、放弃abandon、转出patch out
    task_sponsor = models.ForeignKey(User, on_delete=models.CASCADE)
    task_creat_time = models.DateTimeField(auto_now_add=True)
    task_update_time = models.DateTimeField(auto_now=True)

    @classmethod
    def get_tasks(cls, process_id):
        return cls.objects.filter(process_id=process_id).order_by('task_seq')

    def get_last_task_attachment_snapshot(self):
        contained_steps = Step.get_steps(self.task_id)
        if contained_steps:
            return contained_steps.last().step_attachment_snapshot
        else:
            return

    def get_task_last_attachment_snapshots(self):
        contained_steps = Step.get_steps(self.task_id)
        if contained_steps:
            res = []
            for i in contained_steps:
                res.append(i.step_attachment_snapshot)
            return res
        else:
            return

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

    step_status = models.CharField("执行状态", max_length=255)  # 挂起pending, 执行中processing, 等待awaiting, 完成finish
    step_state = models.CharField("步骤状态", max_length=255)  # 通过approval、驳回deny、撤回withdraw、放弃abandon、转出patch out

    step_type = models.CharField("步骤类型", max_length=255)  # 1. 录入 input  2. 审批 approval 3. 修订 edit 4. 合并 5. 删减 6. 新增
    step_attachment = models.ForeignKey(Attachment, on_delete=models.CASCADE, default=None)
    step_attachment_snapshot = models.JSONField(default=snapshot_default,
                                                blank=True)  # store attachment snapshot cloud be forms { id: 21, title:"love story"}

    def set_condition(self, step_id=None):
        pass

    def get_condition(self):
        pass

    def set_attachment_snapshot(self):
        _z = serializers.serialize('json', self.step_attachment.get_attachment())
        self.step_attachment_snapshot = json.loads(_z)
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
        try:
            return cls.objects.filter(task_id=task_id).order_by('step_seq').order_by('step_create_time')
        except Step.DoesNotExist:
            logging.info(f"Task: {task_id} does not have steps.")
            return Step.objects.none()

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
