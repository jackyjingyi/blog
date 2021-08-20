from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from datetime import datetime, date
from ckeditor.fields import RichTextField
from datetime import datetime, date
import django.utils.timezone as timezone
import logging


class Category(models.Model):
    name = models.CharField(max_length=255)
    chinese_name = models.CharField(max_length=255, default="None")

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


class PostStatus(models.Model):
    name = models.CharField(max_length=255)
    chinese_name = models.CharField(max_length=255, default="None")

    def __str__(self):
        return self.name


class Post(models.Model):
    """
    # status = [
    #     ('1', 'draft','草稿'),
    #     ('2','published','已发布'),
    #     ('3', 'approving1','1级审批'), # 作者已经提交（非draft状态），处于一级审批流程中
    #     ('4', 'approving2','2级审批'), # 一级审批通过，进入二级审批
    #     ('5', 'approving3', '3级审批'), # 二级审批通过，进入三级审批
    #
    # ]
    """

    title = models.CharField(max_length=255, verbose_name="标题")
    title_tag = models.CharField(max_length=255, default="title tag", verbose_name="标签")
    author = models.ForeignKey(User, on_delete=models.PROTECT)
    body = models.TextField(verbose_name="摘要", blank=True, null=True)

    post_date = models.DateTimeField(auto_now_add=True)
    post_file = models.FileField(verbose_name="上传文件")
    category = models.CharField(max_length=255, default='旅游', verbose_name="分类")
    source = models.CharField(max_length=255, default='大数据组', verbose_name="组别")
    views = models.PositiveIntegerField(default=0)
    status = models.ForeignKey(PostStatus, on_delete=models.PROTECT, default=1)

    # timestamp when user hit submit button
    submit_time = models.DateTimeField(null=True, blank=True)

    lv1_approval_status = models.CharField(max_length=5, default='0')  # 0:未提交， 1：已提交未审批，2:已提交已审批通过，3:已提交已驳回
    lv1_approval_action_datetime = models.DateTimeField(null=True, blank=True)  # 调用审批写入审批时间
    lv1_approver = models.IntegerField(default=-1)

    lv2_approval_status = models.CharField(max_length=5, default='0')
    lv2_approval_action_datetime = models.DateTimeField(null=True, blank=True)  # 调用审批写入审批时间
    lv2_approver = models.IntegerField(default=-1)

    lv3_approval_status = models.CharField(max_length=5, default='0')
    lv3_approval_action_datetime = models.DateTimeField(null=True, blank=True)  # 调用审批写入审批时间
    lv3_approver = models.IntegerField(default=-1)

    # post published (after three round approval)
    publish = models.BooleanField(default=False)
    publish_date = models.DateTimeField(null=True, blank=True)

    is_draft = models.BooleanField(default=True, verbose_name="保存")
    is_submit = models.BooleanField(default=False, verbose_name="直接提交")

    # timestamp when draft was saved or submitted
    creation_time = models.DateTimeField(verbose_name="创建时间", default=timezone.now)
    # 1. post was draft 2.remain draft after editing
    update_time = models.DateTimeField(auto_now=True)

    # send to OA system
    # 0: not send yet, 1: in oa_pipe table, 2.sent
    oa_status = models.CharField(max_length=5, default='0')
    # time when put into pipe
    send_submit_time = models.DateTimeField(null=True, blank=True)
    # time when oa_status turn to 2
    oa_success_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title + " | " + str(self.author)

    def get_absolute_url(self):
        return reverse('home')

    def increase_views(self):
        self.views += 1
        self.save(update_fields=['views'])

    def submit(self):
        """
        user submit post,
         TODO: 增加验证
        """
        self.is_draft = False
        self.is_submit = True
        self.lv1_approval_status = '1'
        self.status = PostStatus.objects.get(pk=10)
        self.submit_time = timezone.now()
        self.save()

    def approval_time(self, lv):
        if not self.is_submit:
            logging.warning("Post is not Submitted")
            return
        if lv == 1:
            self.lv1_approval_action_datetime = timezone.now()
            self.save()
        elif lv == 2:
            self.lv2_approval_action_datetime = timezone.now()
            self.save()
        elif lv == 3:
            self.lv3_approval_action_datetime = timezone.now()
            self.save()
        else:
            # error
            raise ValueError

    def approval_positive(self, lv, user_id):
        def _validate(field):
            return str(field) == '1'

        if lv == 1:
            if _validate(self.lv1_approval_status):
                self.lv1_approval_status = '2'
                self.lv2_approval_status = '1'
                # status change to approving 2
                self.status = PostStatus.objects.get(pk=4)
                self.lv1_approver = user_id
                self.save()
                self.approval_time(1)
                # TODO 如果已经被审批
        elif lv == 2:
            if _validate(self.lv2_approval_status):
                self.lv2_approval_status = '2'
                self.lv3_approval_status = '1'
                # status change to approving 3
                self.status = PostStatus.objects.get(pk=5)
                self.lv2_approver = user_id
                self.save()
                self.approval_time(2)
        elif lv == 3:
            if _validate(self.lv3_approval_status):
                self.lv3_approval_status = '2'
                # call publish function
                self.publish = True
                self.publish_date = datetime.now()
                # status change to approving 3
                self.status = PostStatus.objects.get(pk=2)
                self.lv3_approver = user_id
                self.save()
                self.approval_time(3)
        else:
            raise ValueError

    def flush_post(self):
        self.is_draft = True
        self.is_submit = False
        self.lv1_approver = -1
        self.lv2_approver = -1
        self.lv3_approver = -1
        self.lv1_approval_status = '0'
        self.lv2_approval_status = '0'
        self.lv3_approval_status = '0'
        self.status_id = 1
        self.save()

    def revoke_to_draft(self):
        if self.is_submit and not self.publish and any(
                [self.lv1_approval_status == '3', self.lv2_approval_status == '3', self.lv3_approval_status == '3']):
            self.flush_post()

    def approval_deny(self, lv, user_id):
        def _validate(field):
            return str(field) == '1'

        if lv == 1:
            if _validate(self.lv1_approval_status):
                self.lv1_approval_status = '3'
                self.lv2_approval_status = '0'
                # status change to approving 2
                self.status = PostStatus.objects.get(pk=6)
                self.lv1_approver = user_id
                self.save()
                self.approval_time(1)
                # TODO 如果已经被审批
        elif lv == 2:
            if _validate(self.lv2_approval_status):
                self.lv2_approval_status = '3'
                self.lv3_approval_status = '0'
                # status change to approving 3
                self.status = PostStatus.objects.get(pk=7)
                self.lv2_approver = user_id
                self.save()
                self.approval_time(2)
        elif lv == 3:
            if _validate(self.lv3_approval_status):
                self.lv3_approval_status = '3'
                # call publish function
                self.publish = False

                # status change to approving 3
                self.status = PostStatus.objects.get(pk=8)
                self.lv3_approver = user_id
                self.save()
                self.approval_time(3)
        else:
            raise ValueError

    def get_status_verbose_name(self):
        return self.status.chinese_name


class Profile(models.Model):
    CHOICE = [
        ('1', 'publisher'),
        ('2', 'approver'),
        ('3', 'visitor'),
        ('4', 'admin'),
        ('5', 'dev'),
    ]
    user = models.OneToOneField(User, null=True, on_delete=models.CASCADE)
    phone = models.CharField(max_length=25, null=True, blank=True)
    is_lv1_approver = models.BooleanField(default=False)
    is_lv2_approver = models.BooleanField(default=False)
    is_lv3_approver = models.BooleanField(default=False)
    is_publisher = models.BooleanField(default=False)
    is_visitor = models.BooleanField(default=True)
    role = models.CharField(max_length=25, choices=CHOICE, default='3')

    def set_as_lv1_approver(self):
        self.is_lv1_approver = True

    def set_as_lv2_approver(self):
        self.is_lv2_approver = True

    def set_as_lv3_approver(self):
        self.is_lv3_approver = True

    def __str__(self):
        return self.user.username + "| " + str(self.user.pk)
