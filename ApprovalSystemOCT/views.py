import logging
import os
import json
import pdb
import timeit
from datetime import datetime

from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import permission_required, login_required
from django.http import HttpResponseRedirect, JsonResponse
from django.http import HttpResponse, Http404
from django.core import serializers, paginator
from django.conf import settings
import django.utils.timezone as timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser
from rest_framework import mixins
from rest_framework.pagination import PageNumberPagination
from rest_framework import generics

import docx
import IPy
from docx.document import Document
from ApprovalSystemOCT.models import Process, Task, Step, Book, ProcessType, Attachment, ProjectRequirement, \
    PROJECT_TYPE, \
    PROJECT_RESEARCH_DIRECTION, PROJECT_REQUIREMENT_VERBOSE, PROCESS_TYPE
from ApprovalSystemOCT.serializers import BookSerializer, StepSerializer, ProjectRequirementSerializer, \
    ProcessTypeSerializer, AttachmentSerializer, ProcessSerializer
from ApprovalSystemOCT.process import ProjectInputProcess
from ApprovalSystemOCT.docx_handler import TableHandler, ProjectTableHandler

BASE_SIDEBAR_INDEX = {
    "课题需求": {
        "general": [("课题录入", "project_creation"), ("我的课题", "my_projects"), ("所有课题", "display_all_projects"), ]
        # ("我的流程", "my_projects")],
    },
    "立项课题": {
        "general": [("我的立项课题", "annual_user_projects"), ("所有立项课题", "annual_all_projects"),
                    ("进度管理", "project_implement")],
    },
    "课题管理": {
        "general": [("创建流程", "project_settlement"), ("所有课题", "display_all_projects"),
                    ("所有立项课题", "annual_all_projects")]
    }
}
INTERNAL = '172.25.0.0/16'


def get_ip_address(request):
    """
    获取ip地址
    :param request:
    :return:
    """
    ip = request.META.get("HTTP_X_FORWARDED_FOR", "")

    if not ip:
        ip = request.META.get('REMOTE_ADDR', "")
    client_ip = ip.split(",")[-1].strip() if ip else ""
    return client_ip


def if_internal_ip(internal, client_ip):
    # todo
    return client_ip in IPy.IP(internal)


def tag_formatter(tag):
    def add_tags(element, *args, **kwargs):
        tag_properties = ''
        for k, v in kwargs.items():
            if k == 'cls_property':
                tag_properties += f"class = '{v}'"
            else:
                tag_properties += f"{k} = '{v}'"
        return f"<{tag} {tag_properties}>{element}</{tag}>"

    return add_tags


def single_tag_formatter(tag):
    def add_tags(*args, **kwargs):
        tag_properties = ''
        for k, v in kwargs.items():
            if k == 'cls_property':
                tag_properties += f"class = '{v}'"
            elif k == "fortag":
                tag_properties += f"for = '{v}'"
            else:
                tag_properties += f"{k} = '{v}'"
        return f"<{tag} {tag_properties}/>"

    return add_tags


def home_view(request):
    print(get_ip_address(request))
    p1 = Process.objects.all()[0]
    t1 = Task.get_tasks(process_id=p1.process_order_id)
    s1 = [Step.display_steps(task_id=i.task_id) for i in t1]
    context = {
        'book': Book.objects.get(id=1),
        'process': p1,
        'task': t1,
        'step': s1,
        'sidebar_index': BASE_SIDEBAR_INDEX,
    }
    return render(request, 'projectHome.html', context=context)


@login_required
@permission_required('ApprovalSystemOCT.add_projectrequirement', raise_exception=True)
def project_creation(request):
    context = {
        'template_name': "课题录入",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_types': PROJECT_TYPE,
        'project_directions': PROJECT_RESEARCH_DIRECTION,
    }
    return render(request, 'projectCreation.html', context=context)


def display_all_projects(request):
    queryset = Process.objects.filter(status='3', next__isnull=True, process_pattern__process_type="1")
    # queryset = ProjectRequirement.objects.all()
    context = {
        'template_name': "所有课题",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'queryset': queryset,
        'process_types': json.dumps(PROCESS_TYPE[1:]),
        'process_directions': json.dumps(PROJECT_RESEARCH_DIRECTION[1:]),
    }

    return render(request, 'projectAllprojects.html', context=context)


def project_settlement(request):
    context = {
        'template_name': "创建录入流程",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'users': User.objects.filter(groups__in=Group.objects.filter(pk=14)),
        'process_types': PROCESS_TYPE[1:],
    }
    return render(request, 'projectSettlment.html', context=context)


def project_dispatch(request):
    user_set = User.objects.filter(groups=15)

    def get_form(user_set):
        table = tag_formatter("table")
        form = tag_formatter("form")
        label = tag_formatter("label")
        div = tag_formatter("div")
        input_tag = single_tag_formatter("input")
        textarea = single_tag_formatter("textarea")
        select_tag = tag_formatter("select")
        option = tag_formatter("option")
        assignee_label = label("负责人", fortag="assignee")
        users = ""
        if user_set:
            for u in user_set:
                users += option(u.first_name, value=u.id)
        assignee = select_tag(users, cls_property="form-control", id="assignee", name="assignee")
        form_group01 = div(assignee_label + assignee, cls_property="form-group")
        form_zip = div(form(form_group01, id="set_assignee"), style="margin:30px")

        return form_zip

    res = get_form(user_set)
    return JsonResponse({'html': res}, status=200, safe=False)


def project_implement_title(request):
    pass


@login_required(login_url="/memebers/login_to/")
def process_detail(request, pk):
    p = Process.objects.get(process_order_id=pk)
    attachment = p.get_tasks().last().get_steps().last().step_attachment.get_attachment().first()
    context = {
        'template_name': "课题录入",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_types': PROJECT_TYPE,
        'project_directions': PROJECT_RESEARCH_DIRECTION,
        'attachment': attachment,
        'process': p,
    }
    return render(request, 'projectDetail.html', context=context)


def project_implement(request):
    context = {
        'template_name': "课题推进",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'users': User.objects.filter(groups__in=Group.objects.filter(pk=14)),
    }
    return render(request, 'projectImplement.html', context=context)


@csrf_exempt
def requirement_transformation(request):
    if request.method == 'POST':
        requirement_id = request.POST['requirement_id']
        requirement = ProjectRequirement.objects.values().get(pk=requirement_id)
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


def get_users_process(request):
    if request.method == "POST":
        process_queryset = Process.objects.filter(process_executor=request.user)
        pass


@login_required(login_url='/memebers/login_to/')
def my_projects(request):
    user = request.user

    def _get_processlist(status_id):
        user_steps = Step.objects.filter(step_owner=str(user.id))
        task_id_set = user_steps.values("task_id").distinct()

        process_id_set = Task.objects.filter(task_id__in=task_id_set).values("process_id").distinct()
        user_process = Process.objects.filter(process_order_id__in=process_id_set, status=status_id)
        return user_process

    context = {
        'template_name': "我的课题",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'user_process': _get_processlist('1'),
        'user_process_sub': _get_processlist('3'),
        'process_types': PROCESS_TYPE[1:],
        'process_directions': PROJECT_RESEARCH_DIRECTION[1:]
    }

    return render(request, 'projectMyprojects.html', context=context)


@csrf_exempt
@login_required
@permission_required('ApprovalSystemOCT.add_projectrequirement')
def process_creation(request):
    if request.method == 'POST':
        # try:
        # process_type = 1 input process
        # 选定process type 验证时间

        process_type_queryset = ProcessType.objects.filter(process_type=request.POST.get("process_type_id"), status='1',
                                                           process_start_time__lt=timezone.now(),
                                                           process_end_time__gte=timezone.now())
        if not process_type_queryset:
            return JsonResponse({'msg': 'No processing input Process'}, status=500, safe=False)
        else:
            try:

                pc = ProjectInputProcess()
                # import pdb
                # pdb.set_trace()
                p, init_task = pc.process_creation(process_pattern_id=process_type_queryset.first().id,
                                                   process_executor=request.user)

                context = {
                    'process': list(Process.objects.filter(pk=p.pk).values()),
                    'task': list(Task.objects.filter(pk=init_task.task_id).values()),
                }
                print(context)
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


@csrf_exempt
def requirement_bulk_action(request):
    if request.method == 'POST':

        action = request.POST.get("action")
        info = Process.objects.filter(process_order_id__in=json.loads(request.POST.get("info")))
        if action == "submit":
            for idx, process in enumerate(info):
                try:
                    target_task = process.get_tasks().first()
                    # task_type == input
                    # 本步骤不改变attachment
                    last_step = target_task.get_steps().order_by('step_seq').order_by('step_update_time').last()
                    attachment = last_step.step_attachment
                    s = StepSerializer(data={
                        'step_attachment': attachment.attachment_uuid,
                        'task': target_task.task_id,
                        'step_seq': 0,
                        'step_attachment_snapshot': {},
                        'step_owner': request.user.id,
                        'step_status': '3'}
                    )
                    s.is_valid(raise_exception=True)
                    s.save()
                    process.status = '3'
                    process.save()
                    print(attachment)
                except Exception as e:
                    print(e)
                    logging.warning(e)
                    continue
            return JsonResponse({"msg": f"{info.count()} process submitted"}, status=200, safe=False)
        elif action == "delete":
            for idx, process in enumerate(info):
                process.status = '6'
                process.save()
            return JsonResponse({"msg": f"{info.count()} process deleted"}, status=200, safe=False)


@csrf_exempt
def step_creation(request):
    if request.method == 'POST':
        ct = Task.objects.get(pk=request.POST.task_id)
        print(ct)
        return JsonResponse({'msg': 'ok'}, status=200, safe=False)


@csrf_exempt
def get_process_type_list(request):
    if request.method == 'POST':
        _z = list(ProcessType.objects.filter(process_type=request.POST.get("process_type")).values())
        table = tag_formatter("table")
        thead = tag_formatter("thead")
        tbody = tag_formatter("tbody")
        tr = tag_formatter("tr")
        td = tag_formatter("td")
        ul = tag_formatter("ul")
        li = tag_formatter("li")
        th = tag_formatter("th")
        span = tag_formatter("span")
        ptag = tag_formatter("p")
        achor = tag_formatter("a")
        th1 = th("流程类型", scope="col") + th("开始时间", scope="col") + th("结束时间", scope="col") + th("创建人", scope="col") + th(
            "状态", scope="col")
        lis = []
        for i in _z:
            print(i)
            lis.append(tr(
                td(span(i["process_name"])) +
                td(span(datetime.strftime(i["process_start_time"], '%Y-%m-%d %H:%M:%S'))) +
                td(span(datetime.strftime(i["process_end_time"], '%Y-%m-%d %H:%M:%S'))) +
                td(span(User.objects.get(pk=i.get('process_creator_id')).first_name)) +
                td(span(ProcessType.objects.get(pk=i.get("id")).get_status_display())),
                cls_property="processController"
            )
            )

        context = {
            'process_type_list': _z,
            'html': table(thead(tr(th1)) + tbody(("".join(lis))), cls_property="table table-bordered")
        }
        return JsonResponse(context, status=200, safe=False)


def annual_projects(request, user=None):
    if user and request.user.is_authenticated:
        query_set = Process.objects.filter(process_pattern__process_type='7', status='3', process_executor=request.user)
    else:
        query_set = Process.objects.filter(process_pattern__process_type='7', status='3')
    res = {}
    for p in query_set:
        if p.prep:
            res[p.prep] = Process.objects.get(pk=p.prep)
    print(res)
    context = {
        'template_name': "我的课题",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'query_set': query_set,
        'prep_dict': res,
        'process_types': PROCESS_TYPE[1:],
        'process_directions': PROJECT_RESEARCH_DIRECTION[1:]
    }
    return render(request, 'projectAnnualprojects.html', context=context)


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

            process.next = str(_p.process_order_id)
            _p.prep = str(process.process_order_id)
            _p.save()
            process.save()
        except Exception as e:
            _p.delete()
            _t.delete()
            _s.delete()
            print(e)
            _p = Process.objects.none()
            logging.warning(e)
            raise Http404
        return JsonResponse({"msg": "success", "process_id": _p.process_order_id}, status=200, safe=False)


class SmallResultsSetPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 100


class ProcessListWithType(generics.ListAPIView):
    queryset = Process.objects.all()
    serializer_class = ProcessSerializer
    pagination_class = SmallResultsSetPagination

    def get_queryset(self):
        return Process.objects.filter(process_pattern_id=self.request.GET.get("process_type"))


class ProcessTypeList(generics.ListCreateAPIView):
    queryset = ProcessType.objects.all()
    serializer_class = ProcessTypeSerializer

    def perform_create(self, serializer):
        serializer.save()


class ProcessTypeDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProcessType.objects.all()
    serializer_class = ProcessTypeSerializer


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
        print(user)
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
        serializer.instance.set_attachment_snapshot()


class TaskStepList(generics.ListAPIView):
    serializer_class = StepSerializer

    def get_queryset(self):
        task_id = self.kwargs.get('task')
        for i in Step.objects.filter(task_id=task_id).order_by('step_seq'):
            print(i, i.step_attachment_snapshot, type(i.step_attachment_snapshot))
            if i.step_attachment:
                _z = i.step_attachment.get_attachment().first()
                _z.author = "zipper"
                _z.save()

        return Step.objects.filter(task_id=task_id).order_by('step_seq')
