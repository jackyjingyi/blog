import json, os
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
from django.db.models.query import QuerySet
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType


def get_absolute_upload_path():
    _datetime = date.today()
    return os.path.join('', 'projectSystem/{}/{}/'.format(_datetime.year, _datetime.month))


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
            ('patch_projectrequirement', u'分发'),  # 分发
            ("view_projectrequirement_submitted", u"查看课题需求"),
            ("view_projectrequirement_set_to_annual", u"查看年度课题需求"),
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

    class Meta:
        # 一个requirement在一个季度只有一个title
        constraints = [models.UniqueConstraint(fields=['project_base', 'progress_year', 'progress_season'],
                                               name='unique_progress')]


class ImplementMainTask(models.Model):
    base = models.ForeignKey(ProjectImplementTitle, on_delete=models.CASCADE, related_name='main_tasks')
    issue = models.CharField(u"重点工作事项", max_length=500)
    create_time = models.DateTimeField("创建时间", auto_now_add=True)
    update_time = models.DateTimeField("更新时间", auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['base', 'issue'], name='unique_main_task')]


class ImplementSubTask(models.Model):
    base = models.ForeignKey(ImplementMainTask, on_delete=models.CASCADE, related_name='subtasks')
    project_task = models.CharField("分项任务", max_length=255)
    project_task_start_time = models.DateTimeField("分项任务开展时间", null=True, blank=True)
    project_task_end_time = models.DateTimeField("分项任务完成时间", null=True, blank=True)
    season_implement_progress = models.TextField("本季度工作推进情况", null=True, blank=True)
    season_implement_delay_explanation = models.TextField("未能按计划进度完成的原因", null=True, default="无")
    add_ups = models.TextField("相关说明", null=True, blank=True)
    create_time = models.DateTimeField("创建时间", auto_now_add=True)
    update_time = models.DateTimeField("更新时间", auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['base', 'project_task'], name='unique_sub_task')]


class RequirementOutcomes(models.Model):
    # 成果
    project_base = models.ForeignKey(ProjectRequirement, on_delete=models.CASCADE)
    file = models.FileField(verbose_name="上传文件", upload_to=get_absolute_upload_path())
    create_time = models.DateTimeField("创建时间", auto_now_add=True)
    update_time = models.DateTimeField("更新时间", auto_now=True)

    def get_file_name(self):
        return self.file.name.split("/").pop()


class RequirementFiles(models.Model):
    # 资料
    project_base = models.ForeignKey(ProjectRequirement, on_delete=models.CASCADE)
    file = models.FileField(verbose_name="上传文件", upload_to=get_absolute_upload_path())
    create_time = models.DateTimeField("创建时间", auto_now_add=True)
    update_time = models.DateTimeField("更新时间", auto_now=True)

    def get_file_name(self):
        return self.file.name.split("/").pop()


class ApprovalLog(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    related_model = GenericForeignKey('content_type', 'object_id')
    create_time = models.DateTimeField(u"创建时间", auto_now_add=True)
    person = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(u"动作", max_length=10)
    note = models.CharField(u"信息", max_length=255, default='')  # 可为空

    def get_action_verbose(self):
        status_dict = {
            '1': '提交',
            '2': '通过',
            '3': '驳回',
            '4': '撤回',
        }
        return status_dict[self.action]


class ProjectClosure(models.Model):
    project_base = models.ForeignKey(ProjectRequirement, on_delete=models.CASCADE, related_name="project_base")
    start_time = models.DateTimeField("开始时间", null=True, blank=True)
    end_time = models.DateTimeField("完成时间", null=True, blank=True)
    founding_usage = models.CharField(u"经费试用情况", max_length=255)
    project_closure_info = models.TextField(u"课题完成情况")
    status = models.CharField(u'状态', default='0', help_text="0：未提交； 1：已提交；2：已通过；3：已驳回；4：撤回", max_length=10)
    request_from = models.ForeignKey(User, on_delete=models.CASCADE, related_name="request_user")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="receiver")
    create_time = models.DateTimeField(u'创建时间', auto_now_add=True)
    update_time = models.DateTimeField(u'更新时间', auto_now=True)
    logs = GenericRelation(ApprovalLog,related_query_name='closure')

    class Meta:
        constraints = [models.UniqueConstraint(fields=['project_base'], name='unique_project_name')]

    def get_status_verbose(self):
        status_dict = {
            '0': '未提交',  # 提交
            '1': '已提交',  # 撤回, 通过|驳回
            '2': '已通过',  # end
            '3': '已驳回',  # 撤回
            '4': '已撤回',  # 提交
        }
        return status_dict[self.status]


class ProjectImplement(models.Model):
    title = "创新研究课题推进情况季度报表"
    project_base = models.ForeignKey(ProjectImplementTitle, on_delete=models.CASCADE, related_name="implements")
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
    def get_current_max_issue_number(cls, queryset=None):
        if cls.objects.all().count() == 0:
            return 0
        if queryset and isinstance(queryset, QuerySet):
            # 返回某个组下最大的number
            return queryset.order_by('project_important_issue_number').last().project_important_issue_number
        return cls.objects.all().order_by('project_important_issue_number').last().project_important_issue_number

    @classmethod
    def get_issue_number_by_issue(cls, project_base_id, issue):
        queryset = cls.objects.filter(project_base_id=project_base_id, project_important_issue=issue).order_by(
            'project_important_issue_number')

        if queryset:
            # should be in same issue number, => distinct len should = 1
            p = queryset.values('project_important_issue_number').distinct()
            if p.count() == 1:
                return p[0]['project_important_issue_number']
            else:
                logging.warning(
                    f"should not contain more than one issue number with same issue  project_base_id: {project_base_id}; issue: {issue}")
                return p.last().get('project_important_issue_number')
        else:
            # no such number => return largest issue number for all queryset
            return 0 if cls.objects.all().count() == 0 else cls.get_current_max_issue_number() + 1

    @classmethod
    def group_by_base(cls, base_id):
        q = cls.objects.filter(project_base_id=base_id).values('project_important_issue_number').distinct()

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
    # status_choice = [
    #     ("1", "进行中"),
    #     ("2", "未开始"),
    #     ("3", "已结束"),
    #     ("4", "撤销"),
    #     ("5", "暂停"),
    #     ("6", "删除"),
    #     ("7", "立项"),
    #     ("8", "合并")
    # ]
    process_order_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,
                                        help_text="create an uuid for each order")
    process_pattern = models.ForeignKey(ProcessType, on_delete=models.DO_NOTHING)
    process_executor = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True)
    process_owner = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name="owner")
    process_co_worker = models.ManyToManyField(User, related_name="process_co_worker", blank=True)
    create_time = models.DateTimeField(auto_now_add=True)
    status = models.CharField(default="1", max_length=5)
    prev = models.JSONField("前序", default=dict, null=True, blank=True)
    next = models.JSONField("后继", default=dict, null=True, blank=True)
    conjunction = models.JSONField("关联", default=dict, null=True, blank=True)
    read_only = models.CharField(max_length=5, default='0')
    process_leader = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name="leader",
                                       default=1)
    process_state = models.CharField("执行情况", max_length=25, default='0')

    # process_readonly_sponsors = models.CharField(max_length=255)  TODO: 添加流程只读干系人（群） [pk1, pk2]
    # process_administrator = models.CharField(max_length=255)    TODO: 流程管理员（群组)

    class Meta:
        permissions = (
            ("packup_process", u"合并流程"),
            ("dispatch_process", u"分发流程"),
            ("approval_process", u"审批权限"),
            ("view_submitted_process", u"查看已提交课题需求"),
            ("view_unsubmitted_process", u"查看未提交课题需求"),
            ("add_process1", u"创建课题1"),
            ("edit_process1", u"编辑课题1"),
            ("delete_process1", u"删除课题1"),
            ("submit_process1", u"提交课题1"),
            ("edit_process2", u"编辑课题2"),
            ("dispatch_process1", u"分发课题"),
            ("delete_process2", u"删除课题2"),
            ("edit_process3", u"编辑课题3"),
            ("delete_process3", u"删除课题3"),
            ("submit_process2", u"提交课题2"),
            ("edit_process4", u"编辑课题4"),
            ("add_process2", u"创建课题2"),
            ("re_dispatch_process", u"指派课题"),
            ("delete_process4", u"删除课题4"),
            ("edit_process5", u"编辑课题5"),
            ("submit_process3", u"提交课题3"),
            ("deny_process", u"驳回课题"),
            ("withdraw_process", u"撤回课题"),
            ("manage_process", u"管理课题"),
        )

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
    process = models.ForeignKey(Process, related_name="tasks", on_delete=models.CASCADE)
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
    task_co_worker = models.ManyToManyField(User, related_name="co_worker", blank=True)

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

    def current_step_seq(self):
        t = self.get_steps().last().step_seq
        return t


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
    # todo Deprecate
    step_status = models.CharField("执行状态", max_length=255,
                                   default="1")  # 挂起pending, 执行中processing, 等待awaiting, 完成finish, 暂存 save
    step_state = models.CharField("步骤状态",
                                  max_length=255)  # 通过approval、驳回deny、撤回withdraw、放弃abandon、转出patch out 完成3 finish

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
                logging.info(f"info {idx}- {_s.step_attachment_snapshot}")
        return res

    @classmethod
    def get_steps(cls, task_id):
        try:
            return cls.objects.filter(task_id=task_id).order_by('step_seq')
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


class MessageHandler(models.Model):
    source = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name="source_person"),
    receive = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name="receive_person")
    inform = models.ManyToManyField(User, related_name="informed_people")
    step_create_time = models.DateTimeField(auto_now_add=True)
    step_update_time = models.DateTimeField(auto_now=True)
    start_time = models.DateTimeField(null=True, blank=True)
    due_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField("状态", max_length=25)  # 1. done 2. undone 不记录处理结果，只记录是否处理
    comments = models.CharField("备注", max_length=500)
    url = models.URLField("处理链接", max_length=255)

    @classmethod
    def need_message(cls):
        return cls.objects.filter(status='2').order_by("-step_create_time")

    @classmethod
    def get_user_message(cls, user):
        return cls.objects.filter(status='2', receive=user).order_by("-step_create_time")

    def generate_message(self):
        message = message_generator()


class MessagePattern(models.Model):
    message_choices = [
        ('1', u'审批通知'),
        ('2', u'抄送信息'),
        ('3', u'通知信息'),
    ]
    message_type = models.CharField("消息类型", choices=message_choices, max_length=25)
    body = models.TextField("消息主体")


class Message(models.Model):
    # 无需考虑是否读了消息，仅作为记录，
    title = models.CharField("消息标题", max_length=255)
    body = models.TextField("消息主体", )
    pattern = models.ForeignKey(MessagePattern, on_delete=models.CASCADE, related_name="message_pattern")
    url = models.URLField("处理链接", max_length=255)
    create_time = models.DateTimeField(auto_now_add=True)


def message_generator(handler=None, message=None):
    pass


def dingtalk_message_generator():
    pass
