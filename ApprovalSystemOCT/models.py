import json
import uuid
import logging
import copy
import django.db.models
from django.db import models
from django.contrib.auth.models import User
from django.apps import apps
from django.core import serializers
import django.utils.timezone as timezone
from datetime import datetime, date, timedelta
from ApprovalSystemOCT.project_statics.static_data import *


def snapshot_default():
    return {}


class Role(models.Model):
    pass


class Group(models.Model):
    pass


class ProjectDirection(models.Model):
    name = models.CharField("研究方向", max_length=255)
    description = models.TextField("描述")

    def __str__(self):
        return str(self.pk) + self.name + " | " + self.description


class ProjectRequirement(models.Model):
    class Meta:
        permissions = (
            ('patch_requirement', 'can patch requirement'),
        )

    project_name = models.CharField("研究项目", max_length=255)
    project_type = models.CharField("课题类型", choices=PROJECT_TYPE, max_length=25,
                                    help_text="0.未选择,1.创新前瞻性研究；2.产品标准化研究，3.产品创新研究", default="0")
    project_research_direction = models.ManyToManyField(ProjectDirection)
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
    project_approval_time = models.DateTimeField("立项时间", blank=True, null=True)
    project_head_master = models.CharField("分管院长", blank=True, null=True, max_length=255)
    project_sponsor = models.CharField("负责人", blank=True, null=True, max_length=255)
    project_outsourcing_companies = models.JSONField("外部合作单位", null=True, blank=True)
    project_outsourcing_info = models.JSONField("外部合作内容", null=True, blank=True)

    def __str__(self):
        return f"<p>研究项目:                       {self.project_name}</p>" \
               f"<p>研究类型:                       {self.get_project_type_display()} </p>" \
               f"<p>研究方向:                       {self.get_project_research_direction_display()}</p>" \
               f"<p>研究部门:                       {self.project_department} </p>" \
               f"<p>联系人:                         {self.project_department_sponsor} </p>" \
               f"<p>联系方式:                       {self.project_department_phone} </p>" \
               f"<p>联合工作小组成员及分工:            {self.project_co_group}</p>" \
               f"<p>研究经费:                       {self.project_research_funding}</p>" \
               f"<p>外协预算:                        {self.project_outsourcing_funding}</p>" \
               f"<p>研究实施计划时间（起）:            {self.project_start_time}</p>" \
               f"<p>研究实施计划时间（止）:            {self.project_end_time}</p>" \
               f"<p>具体分项任务内容及安排:             {self.project_detail}</p>" \
               f"<p>主要创新研究课题内容、目标及意义:     {self.project_purpose}</p>" \
               f"<p>与课题相关的前期工作情况，现有基础条件:{self.project_preparation}</p>" \
               f"<p>研究课题的重点及难点:              {self.project_difficult}</p>"

    def get_project_research_direction_display(self):
        return ",".join([i.name for i in self.project_research_direction.all()])


class ProjectImplementTitle(models.Model):
    title = "创新研究课题推进情况季度报表"
    project_base = models.ForeignKey(ProjectRequirement, on_delete=models.CASCADE)
    sponsor = models.CharField("负责人", max_length=50, null=True, blank=True)
    department = models.CharField("责任单位/部门", max_length=255)
    progress_year = models.CharField("编报年", max_length=20)
    progress_season = models.CharField("编报季度", max_length=20)
    create_time = models.DateTimeField("创建时间", auto_now_add=True)
    update_time = models.DateTimeField("更新时间", auto_now=True)


class ProjectImplement(models.Model):
    title = "创新研究课题推进情况季度报表"
    project_base = models.ForeignKey(ProjectImplementTitle, on_delete=models.CASCADE)
    project_important_issue = models.CharField("重点工作事项", max_length=500)
    project_important_issue_number = models.IntegerField("重点工作事项编号", default=0)
    project_task = models.CharField("分项任务", max_length=255)
    project_task_seq = models.IntegerField("分项任务编号", default=0)
    project_task_start_time = models.DateTimeField("分项任务开展时间", null=True, blank=True)
    project_task_end_time = models.DateTimeField("分项任务完成时间", null=True, blank=True)
    season_implement_progress = models.TextField("本季度工作推进情况", null=True, blank=True)
    season_implement_delay_explanation = models.TextField("未能按计划进度完成的原因", null=True, default="无")
    add_ups = models.TextField("相关说明", null=True, blank=True)
    create_time = models.DateTimeField("创建时间", auto_now_add=True)
    update_time = models.DateTimeField("更新时间", auto_now=True)

    @classmethod
    def group_by_issues(cls, base_id, issue_id):
        return cls.objects.filter(project_base_id=base_id, project_important_issue_number=issue_id).order_by(
            "project_task_seq")

    @classmethod
    def group_by_base(cls, base_id):
        q = cls.objects.filter(project_base_id=base_id).values('project_important_issue_number').distinct()
        print(q)
        res = []
        if q:
            for i in q:
                res.append(cls.group_by_issues(base_id, i.get("project_important_issue_number")))
        return res


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
    # 更名为工作簿
    status_choice = [
        ("1", "processing"),
        ("2", "not start"),
        ("3", "finished"),
        ("4", "abort"),
        ("5", "pending")
    ]
    process_name = models.CharField("流程名称", max_length=255)
    # process_pattern = models.CharField("流程模板", max_length=255)
    process_type = models.CharField("流程类型", choices=PROCESS_TYPE, max_length=255)
    process_creator = models.ForeignKey(User, on_delete=models.CASCADE)
    process_executor = models.ManyToManyField(User, related_name='executors')
    process_init_time = models.DateTimeField(auto_now_add=True)
    process_update_time = models.DateTimeField(auto_now=True)
    process_start_time = models.DateTimeField(default=timezone.now)
    process_duration = models.DurationField("持续时长", help_text="流程持续天数", null=True)
    process_end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(choices=status_choice, default="1", max_length=5)


class TaskType(models.Model):
    """
    task的原型
    """
    status_choice = [
        ("1", "processing"),
        ("2", "not start"),
        ("3", "finished"),
        ("4", "abort"),
        ("5", "pending")
    ]
    task_name = models.CharField("任务名称", max_length=255)
    task_type = models.CharField("任务类型", max_length=255)
    task_creator = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    task_executor = models.ManyToManyField(User, related_name='task_executors')
    task_init_time = models.DateTimeField("创建时间", auto_now_add=True)
    task_update_time = models.DateTimeField("更新时间", auto_now=True)
    task_start_time = models.DateTimeField("任务开始时间", default=timezone.now)
    task_duration = models.DurationField("持续时长", help_text="流程持续天数", null=True)
    task_end_time = models.DateTimeField("任务结束时间", null=True, blank=True)
    status = models.CharField(choices=status_choice, default="1", max_length=5)

    def __str__(self):
        return self.task_name


class Process(models.Model):
    status_choice = [
        ("1", "进行中"),
        ("2", "未开始"),
        ("3", "已结束"),
        ("4", "撤销"),
        ("5", "暂停"),
        ("6", "删除"),
        ("7", "立项"),
        ("8", "合并")
    ]
    process_order_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                                        help_text="create an uuid for each order")
    process_pattern = models.ForeignKey(ProcessType, on_delete=models.DO_NOTHING)
    process_executor = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    process_owner = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name="owner")
    process_co_worker = models.ManyToManyField(User, related_name="process_co_worker")
    create_time = models.DateTimeField(auto_now_add=True)
    status = models.CharField(choices=status_choice, default="1", max_length=5)
    prev = models.JSONField("前序", default=dict)
    next = models.JSONField("后继", default=dict)
    conjunction = models.JSONField("关联", default=dict)
    read_only = models.CharField(max_length=5, default='0')

    # process_readonly_sponsors = models.CharField(max_length=255)  TODO: 添加流程只读干系人（群） [pk1, pk2]
    # process_administrator = models.CharField(max_length=255)    TODO: 流程管理员（群组)

    def get_owner_name(self):
        return self.process_owner.first_name

    def get_current_status(self):
        return self.get_tasks().last().task_status

    def get_task_status_by_type(self, type):
        task_type = None
        if isinstance(type, str):
            task_type = TaskType.objects.filter(task_type=type, status='1').first()
        elif isinstance(type, TaskType):
            task_type = type
        else:
            logging.warning(f"task_type is None")
            return task_type
        res = False
        try:
            t = Task.objects.get(process=self, task_pattern=task_type)
            res = True
            return (res, t.task_status)
        except Exception as e:
            logging.warning(f"target task does not exist {e}")
            t = self.get_tasks().last()
            return (res, t.task_status)

    def get_tasks(self):
        return Task.get_tasks(self.process_order_id)

    def create_task(self, **kwargs):
        kwargs['process_id'] = self.process_order_id
        # print(kwargs)
        return Task.objects.create(**kwargs)

    def has_snapshots(self):
        for t in self.get_tasks():
            if t.get_task_last_attachment_snapshots():
                return True
        return False

    def get_conjunction(self):
        try:
            return json.loads(self.conjunction)
        except TypeError:
            return json.loads(json.dumps(self.conjunction))

    def set_conjunction(self, x):
        self.conjunction = json.dumps(x)

    def set_prev(self, x):
        self.prev = json.dumps(x)

    def add_prev(self, x):
        self.prev = json.dumps(json.loads(self.prev).append(x))

    def get_prev(self):
        try:
            return json.loads(self.prev)
        except TypeError:
            return json.loads(json.dumps(self.prev))

    def set_next(self, x):
        self.next = json.dumps(x)

    def add_next(self, x):
        self.next = json.dumps(json.loads(self.next).append(x))

    def get_next(self):
        try:
            return json.loads(self.next)
        except TypeError:
            return json.loads(json.dumps(self.next))


class Task(models.Model):
    # A process include many moves,
    # A move include many steps,
    # A move is defines seq oder of steps
    # 串联 step1 => step2
    process = models.ForeignKey(Process, related_name="tasks",on_delete=models.CASCADE)
    task_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                               help_text="create an uuid for each Task")
    task_type = models.CharField("动作类型", max_length=255)
    task_pattern = models.ForeignKey(TaskType, on_delete=models.DO_NOTHING)
    task_seq = models.IntegerField("动作顺序", default=0)
    task_status = models.CharField("执行状态", max_length=255)  # 挂起pending, 执行中processing, 等待awaiting,完成finish
    task_state = models.CharField("动作状态", max_length=255)  # 通过approval、驳回deny、撤回withdraw、放弃abandon、转出patch out
    task_sponsor = models.ForeignKey(User, on_delete=models.CASCADE)
    task_creat_time = models.DateTimeField(auto_now_add=True)
    task_update_time = models.DateTimeField(auto_now=True)
    task_co_worker = models.ManyToManyField(User, related_name="co_worker")

    @classmethod
    def get_tasks(cls, process_id):
        return cls.objects.filter(process_id=process_id).order_by('task_seq')

    def get_steps(self):
        return Step.get_steps(self.task_id)

    def get_last_task_attachment_snapshot(self):
        contained_steps = Step.get_steps(self.task_id)
        if contained_steps.last():

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
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="steps")

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

    step_status = models.CharField("执行状态", max_length=255)  # 挂起pending, 执行中processing, 等待awaiting, 完成finish, 暂存 save
    step_state = models.CharField("步骤状态", max_length=255)  # 通过approval、驳回deny、撤回withdraw、放弃abandon、转出patch out

    step_type = models.CharField("步骤类型",
                                 max_length=255)  # 1.录入 input  2. 提交审批 approval 3. 修订 edit 4. 合并 5. 删减 6. 新增,7.立项
    step_attachment = models.ForeignKey(Attachment, on_delete=models.CASCADE, default=None, related_name="attachments")
    step_attachment_snapshot = models.JSONField(default=snapshot_default,
                                                blank=True)  # store attachment snapshot cloud be forms { id: 21, title:"love story"}
    comments = models.TextField("备注", null=True, blank=True)

    def set_condition(self, step_id=None):
        pass

    def get_condition(self):
        pass

    def get_step_type_display_name(self):
        types = [
            ('1', 'input', '录入'),
            ('2', 'approval/submit', '提交审批'),
            ('3', 'edit', '修改更新'),
            ('4', 'pack up', '合并'),
            ('5', 'delete', '删除'),
            ('6', 'create', '新增'),  # not use
            ('7', 'rise up', '立项')
        ]
        for item in types:
            if item[0] == self.step_type:
                return item[2]

    def get_owner(self):
        return User.objects.get(pk=self.step_owner)

    def set_attachment_snapshot(self):
        _z = serializers.serialize('json', self.step_attachment.get_attachment())
        self.step_attachment_snapshot = copy.deepcopy(json.loads(_z))
        self.save()
        print(self.step_attachment_snapshot)

    def done(self):
        return self.step_status == '3'

    def finish(self):
        self.step_status = '3'

    def get_next_step(self):
        try:
            _next_instance = self.__class__.objects.filter(task_id=self.task_id, step_seq__gte=self.step_seq,
                                                           step_update_time__gt=self.step_update_time).order_by(
                'step_update_time').first()
            return _next_instance
        except models.ObjectDoesNotExist:
            return self.__class__.objects.none()

    @classmethod
    def get_update_history(cls, task_id):
        steps = cls.get_steps(task_id=task_id)
        res = []
        base = steps[0].step_attachment_snapshot[0]['fields']

        for idx, _s in enumerate(steps):

            if idx > 0 and isinstance(_s.step_attachment_snapshot, list):
                try:
                    for k, v in _s.step_attachment_snapshot[0]['fields'].items():
                        current = {}
                        if v != base[k]:
                            current[k] = {"before": base.get(k), "after": v, "update_time": _s.step_update_time,
                                          "step_owner": User.objects.get(pk=_s.step_owner).first_name}
                            res.append(current)
                    base = _s.step_attachment_snapshot[0]['fields']
                except KeyError:
                    logging.warning(f"warning: {idx}- {_s.step_attachment_snapshot}")
            else:
                logging.info(f"{idx}- {_s.step_attachment_snapshot}")
        return res

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


class Finalize(models.Model):
    title = "创新研究课题成果结题信息"
    fin_project_name = models.CharField("课题名称", max_length=500)
    fin_project_type = models.CharField("课题类型", max_length=255)
    fin_departments = models.JSONField("课题组成单位", null=True)
    fin_project_sponsor = models.ForeignKey(User, verbose_name="课题负责人", on_delete=models.CASCADE)
    fin_groups = models.CharField("课题参与团队", max_length=500)
    fin_start_time = models.DateTimeField("开始时间", default=timezone.now)
    fin_end_time = models.DateTimeField("结束时间", default=timezone.now)
    fin_funding_status = models.CharField("经费使用情况", max_length=500)
    fin_project_achievement = models.CharField("课题结题成果", max_length=500)
    fin_project_situation = models.TextField("课题完成情况", help_text="包括研究的背景、过程、结果及问题等")
    fin_pre_audit = models.TextField("预检查情况")


class Action(models.Model):
    pass


class State(models.Model):
    # recording states for an order
    pass
