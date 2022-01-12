import copy
import logging
import os, time
import json, uuid
from datetime import datetime

from django.shortcuts import render, get_object_or_404
from django.db.models import Q
from django.core import serializers
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType, ContentTypeManager
from django.contrib.auth.decorators import permission_required, login_required
from django.http import JsonResponse
from django.http import Http404
from django.conf import settings
from django.db.models.query import QuerySet
from django.db.models import Func, Value
import django.utils.timezone as timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.pagination import PageNumberPagination
from rest_framework import generics
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
import docx
from guardian.shortcuts import assign_perm, get_users_with_perms, get_groups_with_perms
from guardian.models import UserObjectPermission, GroupObjectPermission

from ApprovalSystemOCT.models import Process, Task, TaskType, Step, Book, ProcessType, Attachment, ProjectRequirement, \
    ProjectDirection
from ApprovalSystemOCT.project_statics.static_data import *
from ApprovalSystemOCT.serializers import BookSerializer, StepSerializer, ProjectRequirementSerializer, \
    ProcessTypeSerializer, AttachmentSerializer, ProcessSerializer, UserSerializer, GroupSerializer, \
    PermissionsSerializer, TaskTypeSerializer, TaskSerializer, UserObjectPermissionSerializer, \
    GroupObjectPermissionSerializer
from ApprovalSystemOCT.process import ProjectInputProcess
from ApprovalSystemOCT.docx_handler import ProjectTableHandler
from ApprovalSystemOCT.project_statics.static_function import *
from ApprovalSystemOCT.apps import ApprovalsystemoctConfig
from ApprovalSystemOCT.oct_dingtalk import TodoDing, get_user_info, get_userid, get_auth_token, \
    generate_todo_inform_leader, generate_todo_approval_notice
from ApprovalSystemOCT.decorator import auth_permission_required

logger = logging.getLogger(__name__)
collect_logger = logging.getLogger("collect")


def permissons_collection():
    p = Permission.objects.filter(content_type__app_label=ApprovalsystemoctConfig.name,
                                  content_type__model__in=["projectrequirement", "process", "task", "step",
                                                           "projectimplementtitle"])
    return [(i.id, i.codename) for i in p]


USER_PERMISSIONS = permissons_collection()


def _iter_get_attachment(process, **kwargs):
    app_name = kwargs.get('app_name')
    model_name = kwargs.get('model_name')

    for tsk in process.get_tasks():
        for stp in tsk.get_steps():
            if stp.step_attachment.attachment_app_name == app_name and stp.step_attachment.attachment_app_model == model_name:
                return stp, stp.step_attachment, stp.step_attachment.get_attachment().first()
    return None, None, None


def input_step_init(t, a, u, ty='1', ss='3'):
    # think all step should be status down , no doing stuff keep
    s = Step.objects.create(
        step_attachment=a,
        task=t,
        step_seq=t.get_steps.last().step_seq + 1,
        step_owner=u,
        step_type=ty,  #
        step_status=ss
    )
    s.set_attachment_snapshot()
    return s


def get_attr_from_status_state(lv1, lv2, lv3):
    return settings.STATUS_STATE.get(ApprovalsystemoctConfig.name).get(lv1).get(lv2).get(lv3)


def simple_create_first_task(p, t, u):
    first_task = Task.objects.create(
        process=p,
        task_type=get_attr_from_status_state("task", "type", "input"),
        task_pattern=t,  # admin user can create find leatest
        task_seq=0,
        task_status=get_attr_from_status_state("task", "status", "processing"),  # first task success
        task_state=get_attr_from_status_state("task", "state", "processing"),
        task_sponsor=u,  # 待指派
    )
    return first_task


def home_view(request):
    print(request.session.keys())
    context = {
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'time_interval': TIME_INTERVAL,
        'status_list': STATUS_LIST
    }
    return render(request, 'projectHome.html', context=context)


def development_process(request):
    context = {
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'time_interval': TIME_INTERVAL,
        'status_list': STATUS_LIST
    }
    return render(request, 'development_process.html', context=context)


def display_all_projects(request):
    """
    ######################################
    前提：
    # 查找所有需求录入阶段的process，分别处理
    # 1. 负责人已提交
    # 2. 负责人未提交
    # 3. 已进入立项流程
    # 4. 管理页面，仅管理员可操作
    需求：
    # 1. 提供智能搜索功能
    # 2. 提供分页功能
    # 3. 已提交部分允许动作： 管理员分发、管理员删除、管理员合并、管理员修改
    # 4. 未提交部分允许管理员删除、修改、代为提交
    # 5. 已进入立项流程部分，允许管理员查看、删除（特别确认）、修改（特别确认）
    ######################################
    """
    queryset = Process.objects.filter(process_pattern__process_type="1")  # 所有录入阶段的process

    # submitted first task(task type == 1) status == 3
    queryset_submitted = Process.objects.filter(
        pk__in=[i.pk for i in queryset if i.get_tasks().first().task_status == '3' and i.get_tasks().first()])

    # draft first task (task type ==1 ) status == 1
    queryset_draft = Process.objects.filter(
        pk__in=[i.pk for i in queryset if i.get_tasks().first().task_status == '1' and i.get_tasks().first()])

    # 立项流程1, 提交立项，领导审批中 task(n).task_status == 1
    # 立项流程2, 提交立项， 领导审批结束 task(n).task_status == 3

    # 立项流程2.1 立项成功；

    # 立项流程2.2 立项失败

    already_set_to_annual = []
    not_set_to_annual = []

    context = {
        'template_name': "所有课题",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'queryset': queryset,
        'al': queryset_submitted,
        'nal': queryset_draft,
        'project_type': json.dumps(PROJECT_TYPE[1:]),
        'process_directions': json.dumps(PROJECT_RESEARCH_DIRECTION[1:]),
        'time_interval': TIME_INTERVAL,
        'status_list': STATUS_LIST
    }
    logging.info(f"Here goes {123}")
    return render(request, 'projectAllprojects.html', context=context)


def project_settlement(request):
    context = {
        'template_name': "创建录入流程",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'users': User.objects.filter(groups__in=Group.objects.filter(pk=14)),  #
        'task_types': TASK_TYPE[1:],
    }
    return render(request, 'projectSettlement.html', context=context)


def project_dispatch(request):
    """
    /projectSystem/projectDispatch/
    """
    anu = request.GET.get("annuual")

    user_set = User.objects.filter(groups__name="课题录入组长").extra(
        select={'convert_name': 'convert(first_name using gbk)'},
        order_by=['convert_name']
    )
    user_set_chief = User.objects.filter(groups__name="课题负责领导").extra(
        select={'convert_name': 'convert(first_name using gbk)'},
        order_by=['convert_name']
    )

    def get_form(user_set, user_set_chief, anuual=None):
        def _get_user_selection(opt, target, cls_property):
            _users = ""
            if target:
                for u in target:
                    _users += opt(u.first_name, value=u.id, cls_property=cls_property)
            return _users

        form = tag_formatter("form")
        label = tag_formatter("label")
        div = tag_formatter("div")
        input_tag = single_tag_formatter("input")
        strong = tag_formatter("strong")
        anchor = tag_formatter("a")
        span = tag_formatter("span")
        select_tag = tag_formatter("select")
        option = tag_formatter("option")
        # row1
        assignee_label = label("负责人", fortag="project_sponsor")
        users = _get_user_selection(option, user_set, "process_owner")
        assignee = select_tag(users, cls_property="form-control", id="project_sponsor", name="project_sponsor")
        div_row1_col1 = div(assignee_label + assignee, cls_property="col-md-6")
        users_chief = _get_user_selection(option, user_set_chief, "process_leader")
        label_chief = label("课题负责领导", fortag="project_head_master")
        input_chief = select_tag(users_chief, cls_property="form-control", id="project_head_master",
                                 name="project_head_master")
        div_row1_col2 = div(label_chief + input_chief, cls_property="col-md-6")

        div_row1 = div(div_row1_col1 + div_row1_col2, cls_property="row margin-top-5")
        # row 2
        form_group01 = div(div_row1,
                           cls_property="form-group")
        if anuual:
            label_settle_time = label("立项时间", fortag="project_approval_time")
            project_approval_time = input_tag(value=datetime.strftime(datetime.now(), "%Y年%m月%d日"),
                                              cls_property="form-control",
                                              id="project_approval_time", name="project_approval_time",
                                              disabled="disabled")
            div_row2_col1 = div(label_settle_time + project_approval_time, cls_property="col-md-6")
            div_row2 = div(div_row2_col1, cls_property="row margin-top-5")
            # row3
            label_company = label("外部合作单位", fortag="project_outsourcing_companies_0")
            input_company = input_tag(name="project_outsourcing_companies_0", cls_property="form-control companies",
                                      id="project_outsourcing_companies_0", )
            div_row3_col1 = div(label_company + input_company, cls_property="col-md-6")

            label_company_purpose = label("外部合作内容", fortag="project_outsourcing_info_0")
            input_company_purpose = input_tag(name="project_outsourcing_info_0",
                                              cls_property="form-control companies_info",
                                              id="project_outsourcing_info_0", )

            div_row3_col2 = div(label_company_purpose + input_company_purpose, cls_property="col-md-6")
            div_row3 = div(div_row3_col1 + div_row3_col2, cls_property="row margin-top-5")
            div_row4 = div(div(anchor(span(strong("新增", cls_property="font-bold", ), ),
                                      cls_property="badge badge-info", id="add_one"), cls_property="col-md-6"),
                           cls_property="row margin-top-5")
            form_group01 = div(div_row1 + div_row2 + div_row3 + div_row4,
                               cls_property="form-group")
        form_zip = div(form(form_group01, id="set_assignee"), style="margin:30px")

        return form_zip

    if anu == "true":
        res = get_form(user_set, user_set_chief, anuual=True)
    else:
        res = get_form(user_set, user_set_chief)

    return JsonResponse({'html': res}, status=200, safe=False)


def process_dispatch(request):
    """
    url: '/projectSystem/processDispatch/'
     second task dispatch
     only admin user to operate
     attachment is unchanged
     no further information is required
    """
    if request.method == "POST":
        process_id = request.POST.get("process_id")
        process = Process.objects.get(pk=process_id)
        task_type = request.POST.get("task_type")

        attachment = process.get_tasks().get(task_seq=0).get_steps().last().step_attachment
        # change process owner
        perv_owner = process.process_owner
        new_owner = get_object_or_404(User, pk=request.POST.get("process_owner"))
        new_leader = get_object_or_404(User, pk=request.POST.get("process_leader"))

        # create task2 if needed
        try:
            task2 = process.get_tasks().get(task_type=task_type, task_pattern=TaskType.objects.get(task_type=task_type))
        except:
            z = ("dispatch", 1)
            if task_type == "4":
                z = ("re-dispatch", 3)
            task2 = process.create_task(
                task_seq=z[1],
                # task shold be dispatch
                task_type=get_attr_from_status_state('task', 'type', z[0]),
                task_pattern=TaskType.objects.get(task_type=task_type),
                # task should be processing
                task_status=get_attr_from_status_state('task', 'status', 'success'),
                # task should be processing
                task_state=get_attr_from_status_state('task', 'state', 'success'),
                task_sponsor=request.user,
            )
        # since process owner changed ,task need add pre owner as co_worker, in case both of them need to check detail
        task2.task_co_worker.add(new_owner.id)
        task2.task_co_worker.add(perv_owner.id)
        step0 = Step.objects.create(
            task=task2,
            step_owner=request.user.id,
            # like approval process but dispatch is auto approved
            step_assigner=perv_owner.id,
            step_assignee=new_owner.id,
            step_start_time=timezone.now(),
            step_end_time=timezone.now(),
            step_state=get_attr_from_status_state('step', 'state', 'success'),
            step_type=get_attr_from_status_state('step', 'type', 'dispatch'),
            step_attachment=attachment,
            comments="{0} 由{1}分配给{2}，原负责人{3}".format(datetime.strftime(timezone.now(), "%Y-%m-%dT%H:%M:%S"),
                                                     request.user.first_name, new_owner.first_name,
                                                     perv_owner.first_name)
        )
        step0.set_attachment_snapshot()
        task2.save()
        if task2.task_type == get_attr_from_status_state("task", "type", "dispatch"):  # auto create task3
            try:
                task3 = process.get_tasks().get(task_seq=2,
                                                task_type=get_attr_from_status_state("task", "type", "edit"))
            except:
                task3 = Task.objects.create(
                    process=process,
                    task_type=get_attr_from_status_state("task", "type", "edit"),
                    task_pattern=TaskType.objects.get(task_type=get_attr_from_status_state("task", "type", "edit")),
                    task_seq=2,
                    task_status=get_attr_from_status_state("task", "status", "processing"),
                    task_state=get_attr_from_status_state("task", "state", "processing"),
                    task_sponsor=request.user,
                )
            step_assign = Step.objects.create(
                task=task3,
                step_owner=request.user.id,
                step_assigner=request.user.id,
                step_assignee=new_owner.id,
                step_start_time=timezone.now(),
                step_end_time=timezone.now(),
                step_state=get_attr_from_status_state("step", "state", "success"),
                step_type=get_attr_from_status_state("step", "type", "assign"),
                step_attachment=attachment,
                comments="{0} 由{1}分配给{2}，原负责人{3}".format(datetime.strftime(timezone.now(), "%Y-%m-%dT%H:%M:%S"),
                                                         request.user.first_name, new_owner.first_name,
                                                         perv_owner.first_name)
            )
            task3.save()
            step_assign.set_attachment_snapshot()
        elif task2.task_type == get_attr_from_status_state("task", "type", "re-dispatch"):
            try:
                task3 = process.get_tasks().get(task_seq=4,
                                                task_type=get_attr_from_status_state("task", "type", "re-submit"))
            except:
                task3 = Task.objects.create(
                    process=process,
                    task_type=get_attr_from_status_state("task", "type", "re-submit"),
                    task_pattern=TaskType.objects.get(
                        task_type=get_attr_from_status_state("task", "type", "re-submit")),
                    task_seq=4,
                    task_status=get_attr_from_status_state("task", "status", "processing"),
                    task_state=get_attr_from_status_state("task", "state", "processing"),
                    task_sponsor=request.user,
                )
            step_assign = Step.objects.create(
                task=task3,
                step_owner=request.user.id,
                step_assigner=request.user.id,
                step_assignee=new_owner.id,
                step_start_time=timezone.now(),
                step_end_time=timezone.now(),
                step_state=get_attr_from_status_state("step", "state", "success"),
                step_type=get_attr_from_status_state("step", "type", "assign"),
                step_attachment=attachment,
                comments="{0} 由{1}分配给{2}，原负责人{3}".format(datetime.strftime(timezone.now(), "%Y-%m-%dT%H:%M:%S"),
                                                         request.user.first_name, new_owner.first_name,
                                                         perv_owner.first_name)
            )
            task3.save()
            step_assign.set_attachment_snapshot()
        process.process_owner = new_owner
        process.process_leader = new_leader
        process.process_co_worker.add(perv_owner)
        process.save()
        return JsonResponse(
            {"new_owner": process.process_owner.first_name, "new_leader": process.process_leader.first_name},
            status=200, safe=False)


def get_history(task_id):
    history = []
    for idx, val in enumerate(Step.get_update_history(task_id=task_id), start=1):
        _k = list(val.keys())[0]
        try:
            if _k in PROJECT_REQUIREMENT_VERBOSE.keys():
                before = val[_k].get("before")
                after = val[_k].get("after")
                if "time" in _k:
                    before = datetime.strftime(datetime.strptime(val[_k].get("before"), "%Y-%m-%dT%H:%M:%S"),
                                               "%Y年%m月%d日 %H:%M:%S")
                    after = datetime.strftime(datetime.strptime(val[_k].get("after"), "%Y-%m-%dT%H:%M:%S"),
                                              "%Y年%m月%d日 %H:%M:%S")

                elif _k == 'project_type':
                    before = PROJECT_TYPE[int(val[_k].get("before"))][1]
                    after = PROJECT_TYPE[int(val[_k].get("after"))][1]
                elif _k == "project_research_direction":
                    before = ",".join([ProjectDirection.objects.get(pk=i).name for i in val[_k].get("before")])
                    after = ",".join([ProjectDirection.objects.get(pk=i).name for i in val[_k].get("after")])
                history.append(
                    (
                        idx, datetime.strftime(val[_k].get("update_time"), "%Y年%m月%d日 %H:%M:%S"),
                        val[_k].get("step_owner"),
                        PROJECT_REQUIREMENT_VERBOSE[_k],
                        before, after
                    ))
        except Exception as e:
            logging.warning(e)
    return history


def make_conjunction(ship, bucket, check_func):
    try:
        check_func(bucket)
        ship = json.dumps(json.loads(ship).append(bucket))
    except Exception as e:
        logging.warning(f"{bucket} is not a valid value {e}")
    return ship


@csrf_exempt
def process_pack_up(request):
    # url : processPackUp
    # process_conjunction processConjunction/
    # ship new process, buckets [uuid1:str, uuid2:str]
    # TODO: admin need a default input process type without influenced by time

    if request.method == 'POST':
        # try:
        #     user.groups.get(name="课题系统管理员")
        # except Group.DoesNotExist:
        #     return HttpResponseForbidden
        # buckets store process ids

        data = json.loads(request.POST.get('data'))

        # debug part
        logging.info(f"Get request data {data}")
        logging.info(f"Start set conjunction!")
        # find input process type
        process_type_queryset = ProcessType.objects.filter(process_type='1',
                                                           status='1')  # 管理员不受时间限制

        tasktypes = TaskType.objects.filter(task_type=get_attr_from_status_state("task", "type", "input")).order_by(
            "-task_end_time")

        np = Process.objects.create(
            process_pattern=process_type_queryset.first(),
            process_executor=request.user,  # 暂时本用户
            process_owner=request.user,
            status=get_attr_from_status_state("process", "status", "processing"),
            # prev=
            process_state=get_attr_from_status_state("process", "state", "processing")
        )
        first_task = simple_create_first_task(np, tasktypes.first(), request.user)  # input task, processing

        _prev = []
        _attachments = []
        for i in data:
            logging.info(f"Iterating target {i}")
            p = Process.objects.get(pk=i)
            p.set_conjunction([j for j in data if
                               j != i])
            p.status = get_attr_from_status_state("process", "status", "fail")
            p.process_state = get_attr_from_status_state("process", "state", "packed")
            # 上线取消注释
            p.read_only = '1'
            p.set_next([str(np.process_order_id)])
            _prev.append(str(p.process_order_id))
            _attachments.append(p.get_tasks().last().get_steps().last().step_attachment.get_attachment().first().pk)
            p.save()
        np.set_prev(_prev)
        np.save()
        prd = {}
        prpinstance = ProjectRequirement.objects.get(pk=_attachments[0])
        for i in prpinstance._meta.fields:
            if i.name != 'id':
                prd[i.name] = getattr(prpinstance, i.name)

        rp = ProjectRequirement.objects.create(
            **prd
        )
        at = Attachment.objects.create(
            attachment_app_name='ApprovalSystemOCT',
            attachment_app_model='ProjectRequirement',
            attachment_identify=rp.pk,
        )

        task1_step1 = Step.objects.create(
            task=first_task,
            step_seq=0,
            step_owner=request.user.id,
            step_start_time=timezone.now(),
            step_end_time=timezone.now(),
            step_state=get_attr_from_status_state("step", "state", "success"),
            step_type=get_attr_from_status_state("step", "type", "create"),
            step_attachment=at,
        )
        task1_step1.set_attachment_snapshot()
        task1_step2 = Step.objects.create(
            task=first_task,
            step_seq=task1_step1.step_seq + 1,
            step_owner=request.user.id,
            step_start_time=timezone.now(),
            step_end_time=timezone.now(),
            step_state=get_attr_from_status_state("step", "state", "success"),
            step_type=get_attr_from_status_state("step", "type", "submit"),
            step_attachment=at,
        )
        task1_step2.set_attachment_snapshot()
        first_task.task_status = get_attr_from_status_state("task", "status", "success")
        first_task.task_state = get_attr_from_status_state("task", "state", "success")
        first_task.save()
        ###
        # task 2
        second_task_type = TaskType.objects.filter(
            task_type=get_attr_from_status_state("task", "type", "dispatch")).order_by(
            "-task_end_time").first()
        second_task = Task.objects.create(
            process=np,
            task_type=get_attr_from_status_state("task", "type", "input"),
            task_pattern=second_task_type,  # admin user can create find leatest
            task_seq=first_task.task_seq + 1,  # dispatch seq
            task_status=get_attr_from_status_state("task", "status", "success"),  # first task success
            task_state=get_attr_from_status_state("task", "state", "success"),
            task_sponsor=request.user,  # 待指派
        )
        task2_step1 = Step.objects.create(
            task=second_task,
            step_seq=0,
            step_owner=request.user.id,
            step_start_time=timezone.now(),
            step_end_time=timezone.now(),
            step_state=get_attr_from_status_state("step", "state", "success"),
            step_type=get_attr_from_status_state("step", "type", "dispatch"),
            step_attachment=at,
        )
        task2_step1.set_attachment_snapshot()
        second_task.save()

        ## third task: edit by owner
        third_task_type = TaskType.objects.filter(
            task_type=get_attr_from_status_state("task", "type", "edit")).order_by(
            "-task_end_time").first()
        third_task = Task.objects.create(
            process=np,
            task_type=get_attr_from_status_state("task", "type", "edit"),
            task_pattern=third_task_type,  # admin user can create find leatest
            task_seq=second_task.task_seq + 1,  # dispatch seq
            task_status=get_attr_from_status_state("task", "status", "success"),  # first task success
            task_state=get_attr_from_status_state("task", "state", "success"),
            task_sponsor=request.user,  # 待指派
        )
        task3_step1 = Step.objects.create(
            task=third_task,
            step_seq=0,
            step_owner=request.user.id,
            step_start_time=timezone.now(),
            step_end_time=timezone.now(),
            step_state=get_attr_from_status_state("step", "state", "success"),
            step_type=get_attr_from_status_state("step", "type", "submit"),
            step_attachment=at,
        )
        task3_step1.set_attachment_snapshot()
        third_task.save()

        ## 4th task
        fourth_task_type = TaskType.objects.filter(
            task_type=get_attr_from_status_state("task", "type", "re-dispatch")).order_by(
            "-task_end_time").first()
        fourth_task = Task.objects.create(
            process=np,
            task_type=get_attr_from_status_state("task", "type", "re-dispatch"),
            task_pattern=fourth_task_type,  # admin user can create find leatest
            task_seq=third_task.task_seq + 1,  # dispatch seq
            task_status=get_attr_from_status_state("task", "status", "processing"),  # first task success
            task_state=get_attr_from_status_state("task", "state", "processing"),
            task_sponsor=request.user,  # 待指派
        )
        task4_step1 = Step.objects.create(
            task=fourth_task,
            step_seq=0,
            step_owner=request.user.id,
            step_start_time=timezone.now(),
            step_end_time=timezone.now(),
            step_state=get_attr_from_status_state("step", "state", "success"),
            step_type=get_attr_from_status_state("step", "type", "pack-up"),
            step_attachment=at,
        )
        task4_step1.set_attachment_snapshot()
        fourth_task.save()
        url = f'/projectSystem/projectDetail/{str(np.process_order_id)}/'
        return JsonResponse({'url': url, 'atc': task4_step1.step_attachment_snapshot}, status=200, safe=False)


@csrf_exempt
def get_requirement_content(request):
    if request.method == 'POST':
        p = Process.objects.get(pk=request.POST.get('process_id'))
        ar = p.get_tasks().last().get_steps().last().step_attachment.get_attachment().first()
        _info = ProjectRequirement.objects.values().get(pk=ar.pk)

        return JsonResponse({'info': _info, 'html': ar.__str__()}, status=200, safe=False)


# @login_required(login_url="/members/login_to_app/")
def process_detail(request, pk):
    p = Process.objects.get(process_order_id=pk)
    if request.user.is_authenticated:
        attachment = p.get_tasks().last().get_steps().last().step_attachment
        history = []
        for t in p.get_tasks():
            history += get_history(t.task_id)
        context = {
            'template_name': "课题录入",
            'sidebar_index': BASE_SIDEBAR_INDEX,
            'project_types': PROJECT_TYPE,
            'project_directions': PROJECT_RESEARCH_DIRECTION,
            'attachment': attachment,
            'prev': Process.objects.filter(pk__in=Process.objects.get(pk=p.pk).get_prev()),
            'process': p,
            'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
            'history': history
        }
        return render(request, 'projectDetail.html', context=context)
    else:
        context = {
            'template_name': "课题详情",
            'sidebar_index': BASE_SIDEBAR_INDEX,
            'project_types': PROJECT_TYPE,
            'project_directions': PROJECT_RESEARCH_DIRECTION,
            'process': p,
            'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        }
        return render(request, 'projectViewOnly.html', context=context)


@csrf_exempt
def get_history_log(request):
    # url: getHistoryLog
    if request.method == 'POST':
        process_id, attachment_id = request.POST.get('process_id'), request.POST.get('attachment_id')
        h = []
        for t in Process.objects.get(pk=process_id).get_tasks():
            h += get_history(t.task_id)
        context = {
            'new_history': json.dumps(h),
        }

        return JsonResponse(context, status=200, safe=False)


@csrf_exempt
def requirement_transformation(request):
    if request.method == 'POST':
        requirement_id = request.POST['requirement_id']
        rp = ProjectRequirement.objects.get(pk=requirement_id)
        requirement = ProjectRequirement.objects.values().get(pk=requirement_id)
        requirement['project_research_direction'] = [str(i.get('id')) for i in
                                                     rp.project_research_direction.all().values()]
        path = os.path.join(settings.MEDIA_ROOT, 'template_doc1.docx')

        document = docx.Document(path)
        tb = document.tables[0]
        tbh = ProjectTableHandler()
        tbh(table=tb)
        tbh.dispatch(requirement)
        t = datetime.strftime(timezone.now(), '%Y-%m-%d_%H-%M-%S')
        new_file = os.path.join(settings.MEDIA_ROOT, f"docx/{requirement['project_name']}_{requirement['id']}_{t}.docx")
        document.save(new_file)
        requirement['docx'] = os.path.join(settings.MEDIA_URL,
                                           f"docx/{requirement['project_name']}_{requirement['id']}_{t}.docx")
        return JsonResponse(requirement, status=200, safe=False)


@login_required(login_url="/members/login_to_app/")
def my_projects(request):
    def _get_processlist(user, status_id):
        # change logic here
        process_type = ProcessType.objects.get(process_type='1', status='1')
        process_query_set = Process.objects.filter(process_pattern=process_type, process_executor=user)
        res = []
        for p in process_query_set:
            try:
                if p.get_tasks().first().task_status == status_id:
                    res.append(p.pk)
            except AttributeError:
                logging.warning(f"{p}, {p.get_tasks()}")
        return process_query_set.filter(process_order_id__in=res)

    context = {
        'template_name': "我的课题",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': PROJECT_REQUIREMENT_VERBOSE,
        'user_process': _get_processlist(request.user, '1'),
        'user_process_sub': _get_processlist(request.user, '3'),
        'project_types': PROJECT_TYPE[1:],
        'process_directions': PROJECT_RESEARCH_DIRECTION[1:],
        'time_interval': TIME_INTERVAL,
        'status_list': STATUS_LIST
    }

    return render(request, 'projectMyprojects.html', context=context)


@csrf_exempt
def update_attachment(request):
    # url update_attachment
    if request.method == 'POST':
        _p = Process.objects.get(pk=request.POST.get("process_id"))
        _a = Attachment.objects.get(pk=request.POST.get("attachment_id"))
        # 1:input first task,
        _task_type = request.POST.get("task_type")
        if not _task_type.isnumeric():
            _task_type = get_attr_from_status_state("task", "type", _task_type)
        _tty = TaskType.objects.get(task_type=_task_type)
        # a process
        _t = Task.objects.get(process=_p, task_pattern=_tty)
        _max_seq = _t.get_steps().last().step_seq + 1
        _s = Step.objects.create(
            task=_t,
            step_seq=_max_seq,
            step_owner=request.user.pk,
            step_state=get_attr_from_status_state('step', 'state', 'success'),
            step_type=get_attr_from_status_state('step', 'type', 'edit'),  # edit
            step_attachment=_a,
        )

        _s.set_attachment_snapshot()
        history = []
        for t in _p.get_tasks():
            history += get_history(t.task_id)
        context = {
            'new_history': history,
            'new_step_snapshot': _s.step_attachment_snapshot
        }
        return JsonResponse(context, status=200, safe=False)


@login_required(login_url="/members/login_to_app/")
@permission_required('ApprovalSystemOCT.add_process1', raise_exception=True)
def project_creation(request):
    """
    返回所有已创建但是未关联attachment的process
    """
    # undone_list = Process.objects.filter(
    #     Q(process_owner=request.user) | Q(process_executor=request.user) | Q(process_co_worker__in=[request.user]))
    # todo: check if processes have at least one attachment

    context = {
        'template_name': "课题录入",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_types': PROJECT_TYPE,
        'project_directions': PROJECT_RESEARCH_DIRECTION,
    }
    return render(request, 'projectCreation.html', context=context)


@login_required(login_url="/members/login_to_app/")
@permission_required('ApprovalSystemOCT.manage_process', raise_exception=True)  # 仅系统管理员
def user_management(request):
    # 普通员工
    USER_PERMISSIONS_LV0 = [
        (Permission.objects.get(codename="view_submitted_process").id,
         "ApprovalSystemOCT.view_submitted_process",
         u"查看课题需求", u"允许用户查看已经提交的课题需求。"),
    ]
    # 录入员
    USER_PERMISSIONS_LV1 = [
        (Permission.objects.get(codename="add_process1").id,
         "ApprovalSystemOCT.add_process",
         "新建课题需求", u"允许用户创建新的课题需求。"),
        (Permission.objects.get(codename="edit_process1").id,
         "ApprovalSystemOCT.edit_process1",
         "修改课题需求", u"允许用户修改自己的或指派给自己的课题需求。"),
        (Permission.objects.get(codename="view_unsubmitted_process").id,
         "ApprovalSystemOCT.view_unsubmitted_process",
         "查看未提交课题", u"需求录入第一阶段查看自己创建的尚未提交的需求。"),
        (Permission.objects.get(codename="submit_process1").id,
         "ApprovalSystemOCT.submit_process1",
         "需求初次提交", u"允许用户提交课题需求。"),
        (Permission.objects.get(codename="delete_process1").id,
         "ApprovalSystemOCT.delete_process1",
         "删除课题需求", u"允许用户在需求录入第一阶段删除自己的或指派给自己的课题需求。")
    ]
    # 负责人
    USER_PERMISSIONS_LV2 = [
        (Permission.objects.get(codename="edit_process3").id,
         "ApprovalSystemOCT.edit_process3",
         "线上修订编辑", u"允许用户在线上修订期间编辑课题需求。"),
        (Permission.objects.get(codename="submit_process2").id,
         "ApprovalSystemOCT.submit_process2",
         "立项课题提交", u"允许用户线上修订阶段提交课题需求。"),
        (Permission.objects.get(codename="edit_process5").id,
         "ApprovalSystemOCT.edit_process5",
         "立项编辑", u"允许用户立项审批阶段修改课题需求。"),
        (Permission.objects.get(codename="submit_process3").id,
         "ApprovalSystemOCT.submit_process3",
         "立项提交", u"允许用户提交课题需求进行立项。")
    ]
    # 负责领导
    USER_PERMISSIONS_LV3 = [
        (Permission.objects.get(codename="approval_process").id,
         "ApprovalSystemOCT.approval_process",
         "立项审批", u"审批课题需求，审批成功后转为立项课题。"),
        (Permission.objects.get(codename="deny_process").id,
         "ApprovalSystemOCT.deny_process",
         "立项驳回", u"驳回立项审批申请。"),
        (Permission.objects.get(codename="withdraw_process").id,
         "ApprovalSystemOCT.withdraw_process",
         "撤销", u"撤销立项审批通过或驳回的操作。"),

    ]
    # 管理员
    USER_PERMISSIONS_LV4 = [
        (Permission.objects.get(codename="edit_process2").id,
         "ApprovalSystemOCT.edit_process2",
         "修改课题", u"需求分发阶段，修改需求。"),
        (Permission.objects.get(codename="dispatch_process").id,
         "ApprovalSystemOCT.dispatch_process",
         "分发课题", u"需求分发阶段，分发需求给相关课题负责人。"),
        (Permission.objects.get(codename="delete_process2").id,
         "ApprovalSystemOCT.delete_process2",
         "删除课题", u"需求分发阶段，删除课题。"),
        (Permission.objects.get(codename="edit_process4").id,
         "ApprovalSystemOCT.edit_process4",
         "修改课题", u"整理汇总阶段，修改提交的课题需求。"),
        (Permission.objects.get(codename="edit_process4").id,
         "ApprovalSystemOCT.edit_process4",
         "修改课题", u"整理汇总阶段，修改提交的课题需求。"),
        (Permission.objects.get(codename="packup_process").id,
         "ApprovalSystemOCT.packup_process",
         "合并课题", u"整理汇总阶段，合并提交的课题需求。"),
        (Permission.objects.get(codename="re_dispatch_process").id,
         "ApprovalSystemOCT.re_dispatch_process",
         "指派课题", u"整理汇总阶段，指派提交的课题需求。"),
        (Permission.objects.get(codename="delete_process4").id,
         "ApprovalSystemOCT.delete_process4",
         "删除课题", u"整理汇总阶段，删除提交的课题需求。"),
    ]
    context = {
        'template_name': "用户管理",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_types': PROJECT_TYPE,
        'project_directions': PROJECT_RESEARCH_DIRECTION,
        'groups': Group.objects.filter(id__lt=13),
        'USER_PERMISSIONS_LV0': USER_PERMISSIONS_LV0,
        'USER_PERMISSIONS_LV1': USER_PERMISSIONS_LV1,
        'USER_PERMISSIONS_LV2': USER_PERMISSIONS_LV2,
        'USER_PERMISSIONS_LV3': USER_PERMISSIONS_LV3,
        'USER_PERMISSIONS_LV4': USER_PERMISSIONS_LV4
    }
    return render(request, 'userManagement.html', context=context)


@login_required(login_url="/members/login_to_app/")
@permission_required('ApprovalSystemOCT.manage_process', raise_exception=True)
def user_management_update_permission(request):
    req_data = json.loads(request.body)
    print(req_data)
    # cannot change stuff

    if User.objects.filter(pk=req_data.get('user_id')).exists():
        user = User.objects.get(pk=req_data.get('user_id'))
    else:
        return JsonResponse({'msg':'user does not exists!'}, status=404, safe=False)
    # all permission should within this app
    update_permissions = req_data.get("permissions").get('update')
    all_process_permissions = Permission.objects.filter(content_type__app_label=ApprovalsystemoctConfig.name,
                                                        content_type__model="Process")
    if update_permissions:
        # remove current
        update_permissions = Permission.objects.filter(id__in=update_permissions)
        # 之前已有的权限
        exclude_permissions = all_process_permissions.exclude(id__in=[i.id for i in update_permissions])
        print(exclude_permissions)
        if exclude_permissions:
            for i in exclude_permissions:
                user.user_permissions.remove(i)
            user.save()
        for i in update_permissions:
            user.user_permissions.add(i)
    else:
        for i in all_process_permissions:
            user.user_permissions.remove(i)
    # confirm user's current auth
    return JsonResponse({"msg": "success"}, status=200, safe=False)


@csrf_exempt
@login_required(login_url="/members/login_to_app/")
@permission_required('ApprovalSystemOCT.add_process1', raise_exception=True)  # todo  change to add_process1
def process_creation(request):
    """
    ajax 请求，仅为post
    """
    if request.method == 'POST':
        # try:
        # process_type = 1 input process
        # 选定process type 验证时间
        # 1. 检查是否允许创建
        # 2. 同时创建所有task？

        data = json.loads(request.body)
        process_type_queryset = ProcessType.objects.filter(
            process_type=get_attr_from_status_state('process', 'type', 'requirement'), status='1',
            process_start_time__lt=timezone.now(),
            process_end_time__gte=timezone.now())
        # 获取DB中已创建的task type
        task_allowed = TaskType.objects.filter(task_type=get_attr_from_status_state('task', 'type', 'input'),
                                               status='1', task_start_time__lt=timezone.now(),
                                               task_end_time__gte=timezone.now())
        if not task_allowed:
            return JsonResponse({'msg': 'No processing input Process'}, status=404, safe=False)
        else:
            try:
                # 创建工作簿，并创建第一个task（录入任务）
                p = Process.objects.create(
                    process_pattern=process_type_queryset.first(),
                    process_executor=request.user,  # 如无指派，默认为当前用户
                    process_owner=request.user,  # 如无指派，默认为当前用户
                    status=get_attr_from_status_state('process', 'status', 'processing'),
                    process_state=get_attr_from_status_state('process', 'state', 'processing')
                )

                t = Task.objects.create(
                    process=p,
                    task_type=get_attr_from_status_state('task', 'type', 'input'),
                    task_pattern=task_allowed.first(),
                    task_seq=0,  # 录入任务为0
                    task_status=get_attr_from_status_state('task', 'status', 'processing'),  # processing
                    task_state=get_attr_from_status_state('task', 'state', 'processing'),  # 暂无状态
                    task_sponsor=request.user,  # 如未更改负责人，默认为当前用户
                )

                # create requirement
                _dirs = data['business'].get('project_research_direction')
                del data['business']['project_research_direction']
                b = ProjectRequirement.objects.create(
                    **data['business']
                )
                b.project_research_direction.add(*_dirs)
                b.save()
                # create attachment
                a = Attachment.objects.create(
                    attachment_app_name='ApprovalSystemOCT',
                    attachment_app_model='ProjectRequirement',
                    attachment_identify=b.pk
                )
                # create step
                s = Step.objects.create(
                    task=t,
                    step_seq=0,
                    step_owner=request.user.pk,
                    step_status='3',
                    step_state=get_attr_from_status_state('step', 'state', 'success'),
                    step_type=get_attr_from_status_state('step', 'type', 'create'),
                    step_attachment=a,
                )
                s.set_attachment_snapshot()
                # step bind attachment
                if data['status'] == '3':
                    s1 = Step.objects.create(
                        task=t,
                        step_seq=s.step_seq + 1,
                        step_owner=request.user.pk,
                        step_status='3',
                        step_state=get_attr_from_status_state('step', 'state', 'success'),
                        step_type=get_attr_from_status_state('step', 'type', 'submit'),
                        step_attachment=a,
                    )
                    s1.set_attachment_snapshot()
                    t.task_status = get_attr_from_status_state('task', 'status', 'success')
                    t.task_state = get_attr_from_status_state('task', 'state', 'success')
                    t.save()
                context = {
                    'html': b.__str__(),
                }
            except Exception as e:
                logging.warning(e)
                return JsonResponse({'msg': 'sth goes wrong'}, safe=False)
            return JsonResponse(context, status=200, safe=False)


@csrf_exempt
def finish_process(request):
    if request.method == "POST":
        step_id = request.POST.get("step_id")
        step = Step.objects.get(pk=step_id)
        step.step_status = "3"
        step.save()
        step.task.task_status = "3"
        step.task.save()
        step.task.process.status = "3"
        step.task.process.save()
        return JsonResponse({"msg": "success"}, status=200, safe=False)


def make_action(request):
    if request.method == "POST":
        # check users pri
        # process, task, action, user

        pass


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"], url_path="add_perm")
    def add_perm(self, request, pk=None):
        user = self.get_object()
        # groups = request.data.pop("groups")
        admin = self.request.user
        if admin.has_perm("change_user"):
            # for i in groups:
            #     user.groups.add(i)
            # user.save()
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        else:
            return Response({"error": "No rights"}, status=403)


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.filter(id__lt=13)
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]


@csrf_exempt
def requirement_bulk_action(request):
    if request.method == 'POST':
        # 获取动作代码，以及需要执行的process id列表
        action = request.POST.get("action")
        task_type = request.POST.get('task_type')
        info = Process.objects.filter(process_order_id__in=json.loads(request.POST.get("info")))
        _tty = TaskType.objects.get(task_type=task_type)
        # submit 动作1. 创建step =》 本task状态更新 =》 process状态更新 =》process调整为只读
        for idx, process in enumerate(info):
            try:
                # todo： 当前判断为input task为课题需求流程中第一个任务（task_seq = 0）， 应该按task_type = input进行遍历筛选
                target_task = process.get_tasks().get(task_pattern=_tty)
                last_steps = target_task.get_steps().order_by('step_seq').order_by('step_update_time')
                last_step = last_steps.last()
                # todo catch already delete or submit projects, require 500, 404 templates
                seq = last_step.step_seq + 1
                attachment = last_step.step_attachment
                _s = Step.objects.create(
                    task=target_task,
                    step_seq=seq,
                    # step_condition_type
                    # step_condition
                    step_owner=request.user.pk,  # 提交人
                    # step_assignee=   非指派任务无此项目
                    # step_assigner=   非指派任务无此项目
                    step_status='3',  # 非指派类步骤为原子性，创建即完成
                    step_state='3',  # 3: finish
                    step_type='2',  # 提交、审批
                    step_attachment=attachment,
                )
                if action == 'submit':
                    # 录入任务结束
                    target_task.task_status = '3'
                elif action == 'delete':
                    _s.step_type = '6'
                    target_task.task_status = '6'
                    process.status = '6'
                    process.read_only = '1'
                _s.set_attachment_snapshot()
                target_task.save()
                process.save()
            except Exception as e:
                logging.warning(e)
                continue
        return JsonResponse({"msg": f"{info.count()} process {action}"}, status=200, safe=False)


@csrf_exempt
def step_creation(request):
    if request.method == 'POST':
        ct = Task.objects.get(pk=request.POST.task_id)
        return JsonResponse({'msg': 'ok'}, status=200, safe=False)


@csrf_exempt
def get_process_type_list(request):
    if request.method == 'POST':
        _z = list(TaskType.objects.filter(task_type=request.POST.get("task_type")).values())
        table = tag_formatter("table")
        thead = tag_formatter("thead")
        tbody = tag_formatter("tbody")
        tr = tag_formatter("tr")
        td = tag_formatter("td")
        th = tag_formatter("th")
        span = tag_formatter("span")
        th1 = th("流程类型", scope="col") + th("开始时间", scope="col") + th("结束时间", scope="col") + th("创建人", scope="col") + th(
            "状态", scope="col")
        lis = []
        for i in _z:
            lis.append(tr(
                td(span(i["task_name"])) +
                td(span(datetime.strftime(i["task_start_time"], '%Y-%m-%d %H:%M:%S'))) +
                td(span(datetime.strftime(i["task_end_time"], '%Y-%m-%d %H:%M:%S'))) +
                td(span(User.objects.get(pk=i.get('task_creator_id')).first_name)) +
                td(span(TaskType.objects.get(pk=i.get("id")).get_status_display())),
                cls_property="processController"
            )
            )

        context = {
            'task_type_list': _z,
            'html': table(thead(tr(th1)) + tbody(("".join(lis))), cls_property="table table-bordered")
        }
        return JsonResponse(context, status=200, safe=False)


@csrf_exempt
def set_to_annual_project(request):
    # { process id: id}
    # todo: csrf & authorization

    if request.method == 'POST':
        process = Process.objects.get(pk=request.POST.get("process_id"))
        condition_step = process.get_tasks().last().get_steps().last()
        condition_id = condition_step.step_id
        attachment = condition_step.step_attachment

        try:
            user = User.objects.get(pk=request.POST.get("user_id"))
            annual_settle_process_type = ProcessType.objects.get(
                process_type="7")  # get_object_or_404(ProcessType, process_type='7')
            _p = Process.objects.create(
                process_pattern=annual_settle_process_type,
                process_executor=user,
            )

            _t = _p.create_task(
                task_type='立项',
                task_seq=0,
                task_status='1',  # processing
                task_state='1',  # approval
                task_sponsor=request.user,
            )

            _s = Step.objects.create(
                task=_t,
                step_seq=0,
                step_condition_type="录入|修改",
                step_condition={"step": str(condition_id)},
                step_owner=request.user.id,
                step_assignee=user.id,
                step_assigner=request.user.id,
                step_start_time=timezone.now(),
                step_end_time=timezone.now(),
                step_status="3",  # finish
                step_state="1",  # approval
                step_type="7",  # 立项
                step_attachment=attachment,
            )
            _s.set_attachment_snapshot()
            _p.status = '3'
            _t.task_status = '3'
            process.set_next([str(_p.process_order_id)])
            _p.set_prev([str(process.process_order_id)])
            process.read_only = '1'
            _p.save()
            _t.save()
            process.save()
        except Exception as e:
            print(e)
            logging.warning(e)
            raise Http404
        return JsonResponse({"msg": "success", "process_id": _p.process_order_id}, status=200, safe=False)


class SmallResultsSetPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    page_query_param = "page"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'links': {
                'next': self.get_next_link(),
                'previous': self.get_previous_link()
            },
            'count': self.page.paginator.count,
            'current': self.page.number,
            'total_pages': self.page.paginator.num_pages,
            'results': data,
        })


class ProcessListWithType(generics.ListAPIView):
    queryset = Process.objects.all()
    serializer_class = ProcessSerializer
    pagination_class = SmallResultsSetPagination

    def get_queryset(self):
        """
        kwargs = {
            'process_status' :
            'process_pattern':
            'process_create_time__gte':
        }
        """
        # todo: eval query kwargs

        data = copy.deepcopy(self.request.GET.dict())

        if 'format' in data.keys():
            del data["format"]
        if 'page' in data.keys():
            data.pop('page')

        approval_status = ""
        if 'approval_status' in data.keys():  # ("0", "全部"), ("1", "已审批"), ("2", "待审批")
            logging.info("checking approval_status")
            approval_status = data.get("approval_status")
            data.pop('approval_status')

        has_search = False
        search_value = ""
        if 'search_value' in data.keys():
            has_search = True
            search_value = data['search_value'].strip().lower()
            data.pop("search_value")

        if "process_order_id" in data.keys():
            pid = data["process_order_id"]
            data.pop("process_order_id")
            print(pid)
            return Process.objects.filter(pk=uuid.UUID(pid))

        query_set = Process.objects.filter(**data).filter(process_state__in=['0', '1', '3', '4', '5'])

        if approval_status:
            if approval_status == "0":  # all
                queryset = query_set.filter(
                    pk__in=[p.pk for p in query_set if
                            p.get_tasks().last().task_type == get_attr_from_status_state("task", "type",
                                                                                         "approval")]
                )
            elif approval_status == "1":
                query_set = query_set.filter(
                    pk__in=[p.pk for p in query_set if
                            p.get_tasks().last().task_type == get_attr_from_status_state("task", "type",
                                                                                         "approval") and p.get_tasks().last().task_status != get_attr_from_status_state(
                                "task", "status", "processing")]
                )
            else:
                query_set = query_set.filter(
                    pk__in=[p.pk for p in query_set if
                            p.get_tasks().last().task_type == get_attr_from_status_state("task", "type",
                                                                                         "approval") and p.get_tasks().last().task_status == get_attr_from_status_state(
                                "task", "status", "processing")]
                )
        if has_search:
            query_set = query_set.exclude(pk__in=[p.pk for p in query_set if
                                                  search_value not in p.get_tasks().last().get_steps().last().step_attachment.get_attachment().first().project_name.strip().lower()])
        return query_set


class ProcessListPackUP(generics.ListAPIView):
    queryset = Process.objects.all()
    serializer_class = ProcessSerializer

    def get_queryset(self):
        """
        kwargs = {
            'process_status' :
            'process_pattern':
            'process_create_time__gte':
        }
        """
        # todo: eval query kwargs

        data = copy.deepcopy(self.request.GET.dict())

        if 'format' in data.keys():
            data.pop("format")

        if 'page' in data.keys():
            data.pop('page')

        approval_status = ""
        if 'approval_status' in data.keys():  # ("0", "全部"), ("1", "已审批"), ("2", "待审批")
            logging.info("checking approval_status")
            approval_status = data.get("approval_status")
            data.pop('approval_status')

        has_search = False
        search_value = ""
        if 'search_value' in data.keys():
            has_search = True
            search_value = data['search_value'].strip().lower()
            data.pop("search_value")

        query_set = Process.objects.filter(**data).filter(
            process_state__in=[get_attr_from_status_state("process", "state", "processing"), ],
            process_pattern_id=get_attr_from_status_state("process", "type", "requirement"))

        if approval_status:
            if approval_status == "0":  # all
                query_set = query_set.filter(
                    pk__in=[p.pk for p in query_set if
                            p.get_tasks().last().task_type == get_attr_from_status_state("task", "type",
                                                                                         "approval")]
                )
            elif approval_status == "1":
                query_set = query_set.filter(
                    pk__in=[p.pk for p in query_set if
                            p.get_tasks().last().task_type == get_attr_from_status_state("task", "type",
                                                                                         "approval") and p.get_tasks().last().task_status != get_attr_from_status_state(
                                "task", "status", "processing")]
                )
            else:
                query_set = query_set.filter(
                    pk__in=[p.pk for p in query_set if
                            p.get_tasks().last().task_type == get_attr_from_status_state("task", "type",
                                                                                         "approval") and p.get_tasks().last().task_status == get_attr_from_status_state(
                                "task", "status", "processing")]
                )
        if has_search:
            query_set = query_set.exclude(pk__in=[p.pk for p in query_set if
                                                  search_value not in p.get_tasks().last().get_steps().last().step_attachment.get_attachment().first().project_name.strip().lower()])
        return query_set


class ProcessTypeList(generics.ListCreateAPIView):
    queryset = ProcessType.objects.all()
    serializer_class = ProcessTypeSerializer

    def perform_create(self, serializer):
        serializer.save()


class ProcessTypeDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProcessType.objects.all()
    serializer_class = ProcessTypeSerializer


class TaskTypeViewSet(viewsets.ModelViewSet):
    queryset = TaskType.objects.all()
    serializer_class = TaskTypeSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # users = User.objects.filter(groups)
        # serializer.instance.task_executor.add()
        headers = self.get_success_headers(serializer.data)
        return Response(request.data, status=status.HTTP_201_CREATED, headers=headers)


class ProjectRequirementList(generics.ListCreateAPIView):
    queryset = ProjectRequirement.objects.all()
    serializer_class = ProjectRequirementSerializer
    ATTACHMENT_APP_NAME = 'ApprovalSystemOCT'
    ATTACHMENT_APP_MODEL = 'ProjectRequirement'

    def perform_create(self, serializer):
        serializer.save()
        # TODO: user
        # process = ProjectInputProcess()
        # process.process_creation(process_sponsor=self.kwargs.get('user'))


class AttachmentList(generics.ListCreateAPIView):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer


class ProjectRequirementDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProjectRequirement.objects.all()
    serializer_class = ProjectRequirementSerializer
    ATTACHMENT_APP_NAME = 'ApprovalSystemOCT'
    ATTACHMENT_APP_MODEL = 'ProjectRequirement'


class BookList(generics.ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    ATTACHMENT_APP_NAME = 'ApprovalSystemOCT'
    ATTACHMENT_APP_MODEL = 'Book'

    def perform_create(self, serializer):
        serializer.save()
        user = self.request.user
        _a = Attachment.objects.create(attachment_app_name=self.ATTACHMENT_APP_NAME,
                                       attachment_app_model=self.ATTACHMENT_APP_MODEL,
                                       attachment_identify=serializer.instance.id)

        Step.objects.create(task_id='97a707f8c79549e7bb25568e1cd348f8', step_owner="sda11", step_seq=2,
                            step_attachment=_a)


# patch get put delete
class BookDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    ATTACHMENT_APP_NAME = 'ApprovalSystemOCT'
    ATTACHMENT_APP_MODEL = 'Book'

    def perform_update(self, serializer):
        serializer.save()
        obj = self.get_object()
        _a = Attachment.objects.create(attachment_app_name=self.ATTACHMENT_APP_NAME,
                                       attachment_app_model=self.ATTACHMENT_APP_MODEL,
                                       attachment_identify=obj.id)
        _s = Step.objects.create(task_id='97a707f8c79549e7bb25568e1cd348f8', step_owner="sda11", step_seq=2,
                                 step_attachment=_a)
        _s.set_attachment_snapshot()


class StepDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Step.objects.all()
    serializer_class = StepSerializer


class StepList(generics.ListCreateAPIView):
    queryset = Step.objects.all()
    serializer_class = StepSerializer

    def perform_create(self, serializer):
        serializer.save()
        # create type is 1 <input>
        serializer.instance.step_type = '1'
        serializer.instance.set_attachment_snapshot()


class TaskStepList(generics.ListAPIView):
    serializer_class = StepSerializer

    def get_queryset(self):
        task_id = self.kwargs.get('task')
        for i in Step.objects.filter(task_id=task_id).order_by('step_seq'):
            # print(i, i.step_attachment_snapshot, type(i.step_attachment_snapshot))
            if i.step_attachment:
                _z = i.step_attachment.get_attachment().first()
                _z.author = "zipper"
                _z.save()

        return Step.objects.filter(task_id=task_id).order_by('step_seq')


class PermissionViewSet(viewsets.ModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionsSerializer
    permission_classes = [IsAuthenticated]


class UserObjectPermissionViewSet(viewsets.ModelViewSet):
    queryset = UserObjectPermission.objects.all()
    serializer_class = UserObjectPermissionSerializer
    permission_classes = [IsAuthenticated]


class UserObjectPermissionListView(generics.ListCreateAPIView):
    queryset = UserObjectPermission.objects.all()
    serializer_class = UserObjectPermissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # filter queryset by user id
        # url pattern : /projectSystem/get-user-permission/1/

        # default parameter
        try:
            other_param = json.loads(self.request.body)
        except json.decoder.JSONDecodeError:
            other_param = None
        queryset = self.queryset
        if isinstance(queryset, QuerySet):
            if other_param:
                queryset = queryset.filter(**other_param)
            else:
                queryset = queryset.all()
        return queryset


@csrf_exempt
def check_user_is_admin(request):
    if request.method == "POST":
        req = json.loads(request.body)
        if req.get("user_id").isnumeric():
            group = get_object_or_404(Group, name="课题系统管理员")
            user = get_object_or_404(User, pk=req.get("user_id"))
            if group in user.groups.all():
                # 如果用户属于系统管理员，返回True
                return JsonResponse({"is_admin": True}, status=200, safe=False)
            else:
                return JsonResponse({"is_admin": False}, status=200, safe=False)
        else:
            return JsonResponse({"is_admin": False}, status=200, safe=False)


def first_submit(request):
    if request.method == "POST":
        req = request.POST
        process = get_object_or_404(Process, pk=req.get("process_id"))
        comments = req.get("comments")
        task_type = req.get("task_type")
        task = Task.objects.get(
            process=process, task_type=get_attr_from_status_state("task", "type", task_type),
            task_pattern=TaskType.objects.get(task_type=get_attr_from_status_state("task", "type", task_type))
        )

        last_step = task.get_steps().order_by("step_seq").last()
        step = Step.objects.create(
            task=task,
            step_seq=last_step.step_seq + 1,
            step_owner=request.user.id,
            step_start_time=timezone.now(),
            step_end_time=timezone.now(),
            step_state=get_attr_from_status_state("step", "state", "success"),  # auto approve
            step_type=get_attr_from_status_state("step", "type", "submit"),
            step_attachment=last_step.step_attachment,
            comments=comments
        )
        step.set_attachment_snapshot()
        task.task_status = get_attr_from_status_state("task", "status", "success")
        task.task_state = get_attr_from_status_state("task", "state", "success")
        task.save()
        context = {
            'submit_time': datetime.strftime(timezone.now(), '%Y-%m-%d %H:%M:%S'),  # step.step_end_time
            'submitted_by': request.user.first_name,
            'next_task': '等待分发'
        }
        return JsonResponse(context, status=200, safe=False)


@login_required(login_url="/members/login_to_app/")
def process_deletion(request):
    # /projectSystem/process-deleteion/
    if request.method == "POST":
        req = request.POST
        process = get_object_or_404(Process, pk=req.get("process_id"))
        try:
            assert Group.objects.get(
                name="课题系统管理员") in request.user.groups.all() or process.process_owner.id == request.user.id
        except AssertionError:
            return JsonResponse({"msg": "no rights to delete"}, status=403, safe=False)
        comments = req.get("comments")
        task = process.get_tasks().last()
        last_step = task.get_steps().last()
        step = Step.objects.create(
            task=task,
            step_owner=request.user.id,
            step_start_time=timezone.now(),
            step_end_time=timezone.now(),
            step_state=get_attr_from_status_state("step", "state", "success"),
            step_type=get_attr_from_status_state("step", "type", "delete"),
            step_attachment=last_step.step_attachment,
            comments=comments,
        )
        step.set_attachment_snapshot()
        task.task_state = get_attr_from_status_state("task", "state", "delete")
        task.task_status = get_attr_from_status_state("task", "status", "fail")
        process.process_state = get_attr_from_status_state("process", "state", "delete")
        process.status = get_attr_from_status_state("process", "status", "fail")
        process.save()
        context = {
            'submit_time': datetime.strftime(timezone.now(), '%Y-%m-%d %H:%M:%S'),  # step.step_end_time
            'submitted_by': request.user.first_name,
            'msg': "已删除",
            'process': process.pk
        }
        return JsonResponse(context, status=200, safe=False)


@login_required(login_url="/members/login_to_app/")
def process_re_submit(request):
    if request.method == "POST":
        # 获取信息

        process_id, process_owner, process_leader = request.POST.get("process_id"), request.POST.get(
            "project_sponsor"), request.POST.get("project_head_master")

        companies = [None] * 100
        info = [None] * 100

        for key, val in request.POST.dict().items():
            if "project_outsourcing_companies" in key:
                # company
                companies[int(key.split("_")[-1])] = val
            elif "project_outsourcing_info" in key:
                # info
                info[int(key.split("_")[-1])] = val
        # 获取外协单位信息
        companies = [i for i in companies if i]
        info = [i for i in info if i]
        # 1. process update [company / info]
        re_sub_task, attachment, requirement = Process.objects.get(
            pk=process_id).get_tasks().last(), Process.objects.get(
            pk=process_id).get_tasks().last().get_steps().last().step_attachment, Process.objects.get(
            pk=process_id).get_tasks().last().get_steps().last().step_attachment.get_attachment().first()
        requirement.project_outsourcing_companies = json.dumps(companies)
        requirement.project_outsourcing_info = json.dumps(info)
        requirement.save()

        # 2. task 5 update
        # 3. create submit step
        re_sub_step = Step.objects.create(
            task=re_sub_task,
            step_seq=re_sub_task.current_step_seq() + 1,
            step_owner=request.user.id,
            step_assigner=request.user.id,
            step_assignee=process_leader,
            step_start_time=timezone.now(),
            step_end_time=timezone.now(),
            step_state=get_attr_from_status_state("step", "state", "success"),
            step_type=get_attr_from_status_state("step", "type", "re-sub"),
            step_attachment=attachment,
        )
        re_sub_step.set_attachment_snapshot()
        re_sub_task.task_status = get_attr_from_status_state("task", "status", "success")
        re_sub_task.task_state = get_attr_from_status_state("task", "state", "success")
        re_sub_task.save()
        # 4. create approval task
        try:
            approval_task = Task.objects.get(
                process=Process.objects.get(pk=process_id),
                task_pattern=TaskType.objects.get(task_type=get_attr_from_status_state("task", "type", "approval")),
            )
        except Task.DoesNotExist:
            approval_task = Task.objects.create(
                process=Process.objects.get(pk=process_id),
                task_type=get_attr_from_status_state("task", "type", "approval"),
                task_pattern=TaskType.objects.get(task_type=get_attr_from_status_state("task", "type", "approval")),
                task_seq=re_sub_task.task_seq + 1,
                task_status=get_attr_from_status_state("task", "status", "processing"),
                task_state=get_attr_from_status_state("task", "state", "processing"),
                task_sponsor=User.objects.get(pk=process_leader),
            )
        approval_task.task_co_worker.add(request.user)
        approval_task.task_status = get_attr_from_status_state("task", "status", "processing")
        approval_task.task_state = get_attr_from_status_state("task", "state", "processing")
        approval_task.save()

        # create occupy step
        if not approval_task.get_steps().filter(step_seq=0).exists():
            approval_step = Step.objects.create(
                task=approval_task,
                step_seq=0,
                step_owner=process_leader,
                step_start_time=timezone.now(),
                step_end_time=timezone.now(),
                step_state=get_attr_from_status_state("step", "state", "success"),
                step_type=get_attr_from_status_state("step", "type", "occupy"),
                step_attachment=attachment,
                comments="自动生成占位",
            )
            approval_step.set_attachment_snapshot()
        # if not => create
        # 5. create message
        dingding_todo(process_id=process_id, creator=User.objects.get(username='18835168547'))  # 已测试

        return JsonResponse({"msg": "ok"}, status=200, safe=False)


def dingding_todo(process_id, creator, move=None, comments=None):
    # get unionid by mobile
    try:
        participant_users = Group.objects.get(name=u"课题系统管理员").user_set.all().exclude(id=1)
        auth_token = get_auth_token(settings.DING_TALK.get("ak"), settings.DING_TALK.get("sk")).body.access_token
        participants_userinfo = []

        for u in participant_users:
            if u.username.isnumeric():  # 用户名为手机号
                userid = get_userid(mobile=u.username, access_token=auth_token)
                user_info = get_user_info(userid=userid, access_token=auth_token)
                participants_userinfo.append(user_info)
        # creator

        c_userid = get_userid(mobile=creator.username, access_token=auth_token)
        c_user_info = get_user_info(userid=c_userid, access_token=auth_token)
        # executor
        leader = User.objects.get(first_name="何明威")  # Process.objects.get(pk=process_id).process_leader

        l_userid = get_userid(mobile=leader.username, access_token=auth_token)
        l_user_info = get_user_info(userid=l_userid, access_token=auth_token)
        assert move
        if move:
            pay = generate_todo_approval_notice(
                creator_id=c_user_info[0],
                creator_name=c_user_info[1],
                project_name="测试代办事项",
                url="http://bigdata.octiri.com/",
                executorIds=[c_user_info[0]],
                participantIds=[i[0] for i in participants_userinfo],
                priority=20,
                # due_time=round(time.time() * 1000),
                move=move,
                comments=comments
            )

        else:
            pay = generate_todo_inform_leader(
                creator_id=c_user_info[0],
                creator_name=c_user_info[1],
                project_name="测试代办事项",
                url="http://bigdata.octiri.com/",
                executorIds=[l_user_info[0]],
                participantIds=[i[0] for i in participants_userinfo],
                priority=20,
                comments=comments
                # due_time=round(time.time() * 1000)
            )

        client = TodoDing()
        client.main(auth_token, **pay)
    except Exception as e:
        print(e)


@login_required(login_url="/members/login_to_app/")
@permission_required('ApprovalSystemOCT.approval_process', raise_exception=True)
def project_leader_dashboard(request):
    context = {
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'time_interval': TIME_INTERVAL,
        'status_list': APPROVAL_STATUS_LIST,
    }
    return render(request, 'projectLeaderDashboard.html', context=context)


@login_required(login_url="/members/login_to_app/")
@permission_required('ApprovalSystemOCT.approval_process', raise_exception=True)
def approval_process(request):
    if request.method == "POST":
        process_id, comments, move = request.POST.get("process_id"), request.POST.get("comments"), request.POST.get(
            "move")

        req_process = get_object_or_404(Process, pk=process_id)
        app_task = get_object_or_404(Task,
                                     process=req_process,
                                     task_type=get_attr_from_status_state("task", "type", "approval")
                                     )
        if move == "approval":
            # approval to annual
            # 1. step => success
            app_step = Step.objects.create(
                task=app_task,
                step_seq=app_task.get_steps().last().step_seq + 1,
                step_owner=request.user.id,
                step_assigner=request.user.id,
                step_assignee=req_process.process_owner.id,
                step_start_time=timezone.now(),
                step_end_time=timezone.now(),
                step_status=get_attr_from_status_state("step", "status", "processing"),
                step_state=get_attr_from_status_state("step", "state", "success"),
                step_type=get_attr_from_status_state("step", "type", "approval"),
                comments=comments,
                step_attachment=app_task.get_steps().last().step_attachment,
            )
            app_step.set_attachment_snapshot()
            # 2. task => success
            app_task.task_status = get_attr_from_status_state("task", "status", "success")
            app_task.task_state = get_attr_from_status_state("task", "state", "approve")
            app_task.save()
            # 3. process => success
            req_process.process_state = get_attr_from_status_state("process", "state", "success")
            req_process.status = get_attr_from_status_state("process", "status", "success")

            # 4. create annual process
            annual_process = Process.objects.create(
                process_pattern=ProcessType.objects.get(process_type="2"),
                process_executor=req_process.process_executor,
                process_owner=req_process.process_owner,
                status=get_attr_from_status_state("process", "status", "processing"),
                process_leader=request.user,
            )
            annual_process.set_prev([str(req_process.pk)])
            req_process.set_next([str(annual_process.pk)])
            annual_process.save()
            req_process.save()
            # 5. annual_process task1
            annual_init_task = Task.objects.create(
                process=annual_process,
                task_type=get_attr_from_status_state("task", "type", "annual_init"),
                task_seq=0,
                task_pattern=TaskType.objects.get(task_type=get_attr_from_status_state("task", "type", "annual_init")),
                task_status=get_attr_from_status_state("task", "status", "success"),
                task_state=get_attr_from_status_state("task", "state", "success"),
                task_sponsor=annual_process.process_owner,
            )
            annual_step_init = Step.objects.create(
                task=annual_init_task,
                step_seq=0,
                step_owner=annual_process.process_owner.id,
                step_start_time=timezone.now(),
                step_end_time=timezone.now(),
                step_state=get_attr_from_status_state("step", "state", "success"),
                step_type=get_attr_from_status_state("step", "type", "occupy"),
                step_attachment=app_step.step_attachment,
                comments=comments
            )
            annual_attachment_project = annual_step_init.step_attachment.get_attachment().first()
            annual_attachment_project.project_approval_time = timezone.now()
            annual_attachment_project.project_sponsor = annual_process.process_owner.first_name
            annual_attachment_project.project_head_master = annual_process.process_leader.first_name
            annual_attachment_project.save()
            annual_step_init.set_attachment_snapshot()
        elif move == "deny":
            # 1. create deny step
            app_step = Step.objects.create(
                task=app_task,
                step_seq=app_task.get_steps().last().step_seq + 1,
                step_owner=request.user.id,
                step_assigner=request.user.id,
                step_assignee=req_process.process_owner.id,
                step_status=get_attr_from_status_state("step", "status", "processing"),
                step_start_time=timezone.now(),
                step_end_time=timezone.now(),
                step_state=get_attr_from_status_state("step", "state", "fail"),
                step_type=get_attr_from_status_state("step", "type", "deny"),
                comments=comments,
                step_attachment=app_task.get_steps().last().step_attachment,
            )
            app_step.set_attachment_snapshot()
            # 2. task => success
            app_task.task_status = get_attr_from_status_state("task", "status", "processing")
            app_task.task_state = get_attr_from_status_state("task", "state", "pending")
            app_task.save()
            # 3. process => success
            req_process.process_state = get_attr_from_status_state("process", "state", "deny")
            req_process.status = get_attr_from_status_state("process", "status", "stop")
            req_process.save()

            re_submit_task = Task.objects.get(
                process=req_process,
                task_type=get_attr_from_status_state("task", "type", "re-submit")
            )
            re_submit_task.task_status = get_attr_from_status_state("task", "status", "processing")
            re_submit_task.task_state = get_attr_from_status_state("task", "state", "processing")
            re_submit_task.save()
        else:  # withdraw
            # 1. create withdraw step
            withdraw_step = Step.objects.create(
                task=app_task,
                step_seq=app_task.get_steps().last().step_seq + 1,
                step_owner=request.user.id,
                step_assigner=request.user.id,
                step_assignee=req_process.process_owner.id,
                step_start_time=timezone.now(),
                step_end_time=timezone.now(),
                step_status=get_attr_from_status_state("step", "status", "processing"),
                step_state=get_attr_from_status_state("step", "state", "success"),
                step_type=get_attr_from_status_state("step", "type", "withdraw"),
                step_attachment=app_task.get_steps().last().step_attachment,
                comments=comments
            )
            withdraw_step.set_attachment_snapshot()
            # 2. app_task =>processing
            #  if prev approved

            if app_task.task_state == get_attr_from_status_state("task", "state", "approve"):
                # 3. delete next process , empty .next
                next_process = json.loads(req_process.next)  # <list>
                for p in next_process:
                    Process.objects.get(pk=p).delete()

                # 4. change current process status & state
                req_process.set_next([])
                req_process.status = get_attr_from_status_state("process", "status", "processing")
                req_process.process_state = get_attr_from_status_state("process", "state", "processing")
                req_process.save()
            # change task status & state
            app_task.task_status = get_attr_from_status_state("task", "status", "processing")
            app_task.task_state = get_attr_from_status_state("task", "state", "processing")
            app_task.save()
            # change process status & state
            req_process.status = get_attr_from_status_state("process", "status", "processing")
            req_process.process_state = get_attr_from_status_state("process", "state", "processing")
            req_process.save()

        move_dict = {
            "approval": "通过",
            "deny": "驳回",
            "withdraw": "撤销"
        }
        dingding_todo(process_id=process_id, creator=User.objects.get(username="18835168547"), move=move_dict[move],
                      comments=comments)  # 已测试
        return JsonResponse({"msg": move + "success"}, status=200, safe=False)


@login_required(login_url="/members/login_to_app/")
def process_stage1_get_todo_lists_for_leaders(request):
    # waiting for processing
    tasks = Task.objects.filter(
        task_type=get_attr_from_status_state("task", "type", "approval")
    ).exclude(task_status=get_attr_from_status_state("task", "status", "processing"))

    TaskSerializer()


class TaskLisCreateView(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="get-leader-todos")
    def get_leader_todos(self, request):
        user = self.request.user
        # groups = request.data.pop("groups")
        tasks = Task.objects.filter(
            task_type=get_attr_from_status_state("task", "type", "approval"), task_sponsor=user,
            task_status=get_attr_from_status_state("task", "status", "processing")
        )
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)


def check_information_for_group_leader(request):
    # only group leader request
    if request.user.is_authenticated:
        if request.method == "POST":
            # post => notice
            pass
        projects = Process.objects.filter(process_owner=request.user)
        tasks = Task.objects.filter(process__in=projects,
                                    task_type=get_attr_from_status_state("task", "type", "approval"))
        steps = [task.get_steps().filter(task__in=tasks, step_assignee=request.user.id,
                                         step_type__in=[get_attr_from_status_state("step", "type", "approval"),
                                                        get_attr_from_status_state("step", "type", "deny"),
                                                        get_attr_from_status_state("step", "type", "withdraw"),
                                                        ], step_status=get_attr_from_status_state("step", "status",
                                                                                                  "processing")).order_by(
            "step_create_time").last()
                 for task in tasks]

        if any(steps):
            context = {
                "steps": json.loads(
                    serializers.serialize("json", Step.objects.filter(step_id__in=[s.pk for s in steps if s])))
            }
        else:
            return JsonResponse({"msg": "no info"}, status=404, safe=False)
        return JsonResponse(context, status=200, safe=False)
    else:
        return JsonResponse({"msg": "no auth"}, status=403, safe=False)


def annual_project_detail1(request, pk):
    p = Process.objects.get(process_order_id=pk)
    step, attachment, obj = _iter_get_attachment(process=p,
                                                 **{'app_name': 'ApprovalSystemOCT',
                                                    'model_name': 'ProjectRequirement'})
    logging.debug(f"Searching app_name <ApprovalSystemOCT> model_name <ProjectRequirement>")
    context = {
        'template_name': "课题详情",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_types': PROJECT_TYPE,
        'project_directions': PROJECT_RESEARCH_DIRECTION,
        'process': p,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
    }
    if not step and not attachment and not obj:
        logging.info(f"Current process <{p.pk}> does not contain any Attachment!")
    else:
        context['attachment'] = attachment
        context['obj'] = obj
        logging.debug(f"Current Process <{p.pk}> contains Attachment <{attachment.pk}>")
    return render(request, 'projectViewOnly.html', context=context)
