import logging
import os
import json
from datetime import datetime

from django.shortcuts import render
from django.contrib.auth.models import User, Group
from django.db.models.query import QuerySet
from django.core.exceptions import PermissionDenied
from django.contrib.auth.decorators import permission_required, login_required
from django.http import JsonResponse
from django.core import serializers
from django.http import Http404
from django.conf import settings
import django.utils.timezone as timezone
from django.views.decorators.csrf import csrf_exempt
from ApprovalSystemOCT.project_statics.static_data import *
from rest_framework.pagination import PageNumberPagination
from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework import status

from ApprovalSystemOCT.models import Process, ProjectImplement, ProjectImplementTitle, \
    ImplementMainTask, ImplementSubTask, RequirementOutcomes, ApprovalLog, RequirementFiles, ProjectClosure
from ApprovalSystemOCT.project_statics.static_data import *
from ApprovalSystemOCT.serializers import ProjectImplementTitleSerializer, ProjectImplementSerializer, \
    ImplementSubTaskSerializer, ImplementMainTaskSerializer, RequirementOutcomesSerializer, ApprovalLogSerializer, \
    RequirementFilesSerializer, ProjectClosureSerializer
from ApprovalSystemOCT.views import get_attr_from_status_state, SmallResultsSetPagination


def _iter_get_attachment(process, **kwargs):
    app_name = kwargs.get('app_name')
    model_name = kwargs.get('model_name')

    for tsk in process.get_tasks():
        for stp in tsk.get_steps():
            if stp.step_attachment.attachment_app_name == app_name and stp.step_attachment.attachment_app_model == model_name:
                return stp, stp.step_attachment, stp.step_attachment.get_attachment().first()
    return None, None, None


def annual_projects(request, user=None):
    if user and request.user.is_authenticated:

        query_set = Process.objects.filter(
            process_pattern__process_type=get_attr_from_status_state("process", "type", "annual"),
            process_owner=request.user).exclude(process_state=get_attr_from_status_state("process", "state", "delete"))
    else:
        query_set = Process.objects.filter(
            process_pattern__process_type=get_attr_from_status_state("process", "type", "annual")).exclude(
            process_state=get_attr_from_status_state("process", "state", "delete"))
    res = {}
    context = {
        'template_name': "我的课题",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'query_set': query_set,
        'prev_dict': res,
        'process_types': PROCESS_TYPE[1:],
        'process_directions': PROJECT_RESEARCH_DIRECTION[1:]
    }
    return render(request, 'projectAnnualprojects.html', context=context)


def annual_project_detail(request, pk):
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
    return render(request, 'project_Annual_project_management_main.html', context=context)


def project_finalize(request, pk):
    p = Process.objects.get(pk=pk)
    step, attachment, finalize_obj = _iter_get_attachment(process=p,
                                                          **{'app_name': 'ApprovalSystemOCT', 'model_name': 'Finalize'})

    context = {
        'template_name': "课题推进",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'users': User.objects.filter(groups__in=Group.objects.filter(pk=14)),
        'attachment': attachment,
        'process': p,
    }
    return render(request, 'project_Annual_project_management_finlize.html', context=context)


@csrf_exempt
@login_required(login_url="/members/login_to_app/")
def get_process_requirement(request):
    if request.method == 'POST':
        req = json.loads(request.body)
        # get project requirement
        if ProjectImplementTitle.objects.filter(project_base_id=req.get("pr_id"),
                                                **req.get("require").get("query")).exists():
            print(req)
            required_obj = ProjectImplementTitle.objects.get(project_base_id=req.get("pr_id"),
                                                             **req.get("require").get("query"))
            required_obj_subs = get_implements(required_obj)
            print(required_obj)
            if required_obj_subs:
                print(required_obj_subs)
        else:
            return JsonResponse({"msg": "null", "code": 0}, status=200, safe=False)
    return JsonResponse({"msg": 'success'}, status=200, safe=False)


def get_implements(*args):
    pro_title = args[0]

    try:
        implement_list = ProjectImplement.objects.filter(project_base=pro_title)
        implement_list = implement_list.order_by("create_time")
        ans = serializers.serialize('json', implement_list)
        return serializers.serialize('json', implement_list)
    except ProjectImplement.DoesNotExist:
        return None


class ImplementTitleList(generics.ListCreateAPIView):
    # url: implement_title_list
    queryset = ProjectImplementTitle.objects.all()
    serializer_class = ProjectImplementTitleSerializer

    # pagination_class = SmallResultsSetPagination

    def get_queryset(self):
        try:
            other_param = self.request.query_params.dict()
            if "format" in other_param.keys():
                other_param.pop("format")
        except json.decoder.JSONDecodeError:
            other_param = None
        queryset = self.queryset
        if isinstance(queryset, QuerySet):
            if other_param:
                queryset = queryset.filter(**other_param)
            else:
                queryset = queryset.all()
        return queryset


class ImplementTitleDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProjectImplementTitle.objects.all()
    serializer_class = ProjectImplementTitleSerializer


class ProjectImplementSerializerListCreateView(generics.ListCreateAPIView):
    queryset = ProjectImplement.objects.all()
    serializer_class = ProjectImplementSerializer
    ordering = ('create_time')

    def perform_create(self, serializer):
        serializer.save()
        serializer.instance.project_important_issue_number = ProjectImplement.get_issue_number_by_issue(
            project_base_id=serializer.instance.project_base.id, issue=serializer.instance.project_important_issue)
        print(ProjectImplement.get_issue_number_by_issue(
            project_base_id=serializer.instance.project_base.id, issue=serializer.instance.project_important_issue))
        serializer.instance.save()


class ProjectImplementSerializerDetailCreateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProjectImplement.objects.all()
    serializer_class = ProjectImplementSerializer

    def perform_update(self, serializer):
        serializer.save()
        queryset = ProjectImplement.objects.filter(
            project_base_id=serializer.instance.project_base.id,
            project_important_issue_number=serializer.instance.project_important_issue_number
        )
        for p in queryset:
            p.project_important_issue = serializer.instance.project_important_issue
            p.save()


@login_required(login_url="/members/login_to_app/")
def implement_tasks(request, pk):
    p = Process.objects.get(process_order_id=pk)
    user_set = set()
    # for j in [i.user_set for i in Group.objects.filter(name__in=["课题系统管理员", "课题负责领导"])]:
    #     for m in j.all():
    #         user_set.add(m)
    # if all([request.user != p.process_owner, request.user not in user_set]):
    #
    #     raise PermissionDenied
    # else:
    step_pr, attachment_pr, obj_pr = _iter_get_attachment(process=p,
                                                          **{'app_name': 'ApprovalSystemOCT',
                                                             'model_name': 'ProjectRequirement'})
    step, attachment, obj = _iter_get_attachment(process=p,
                                                 **{'app_name': 'ApprovalSystemOCT',
                                                    'model_name': 'ProjectImplementTitle'})

    context = {
        'template_name': "进度管理1",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_types': PROJECT_TYPE,
        'project_directions': PROJECT_RESEARCH_DIRECTION,
        'process': p,
        # 'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'attachment_pr': attachment_pr,
        'obj_pr': obj_pr,
        'years': [datetime.now().year + i for i in range(-3, 3, 1)],
        'cy': datetime.now().year,
    }

    if not step and not attachment and not obj:
        # None, None, None; create simple inputs table
        context['new_creation'] = True
        logging.warning(f"Current Process {p.pk} does not contains any Attachment!")
    else:
        implement_list = ImplementMainTask.objects.filter(base=obj)
        context['attachment'] = attachment
        context['implement_obj'] = obj
        context['new_creation'] = False
        if implement_list:
            context['implement_list'] = implement_list
    return render(request, 'implementTasks.html', context=context)


# ImplementSubTaskSerializer,ImplementMainTask
class ImplementMainTaskListCreateView(generics.ListCreateAPIView):
    queryset = ImplementMainTask.objects.all()
    serializer_class = ImplementMainTaskSerializer
    filter_backends = [filters.OrderingFilter]
    ordering = ['id']

    def get_queryset(self):
        try:
            other_param = self.request.query_params.dict()
            if "format" in other_param.keys():
                other_param.pop("format")
        except json.decoder.JSONDecodeError:
            other_param = None
        queryset = self.queryset
        if isinstance(queryset, QuerySet):
            if other_param:
                queryset = queryset.filter(**other_param)
            else:
                queryset = queryset.all()
        return queryset


class ImplementMainTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ImplementMainTask.objects.all()
    serializer_class = ImplementMainTaskSerializer


class ImplementSubTaskListCreateView(generics.ListCreateAPIView):
    queryset = ImplementSubTask.objects.all()
    serializer_class = ImplementSubTaskSerializer
    filter_backends = [filters.OrderingFilter]
    ordering = ['project_task_start_time']

    def get_queryset(self):
        try:
            other_param = self.request.query_params.dict()
            if "format" in other_param.keys():
                other_param.pop("format")
        except json.decoder.JSONDecodeError:
            other_param = None
        queryset = self.queryset
        if isinstance(queryset, QuerySet):
            if other_param:
                queryset = queryset.filter(**other_param)
            else:
                queryset = queryset.all()
        return queryset


class ImplementSubTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ImplementSubTask.objects.all()
    serializer_class = ImplementSubTaskSerializer


def outcome_main_page(request, pk):
    # left side bar
    # requirement{title, type, department,sponsor, team,start_time, end_time, money usage
    # file oucome
    # text
    p = Process.objects.get(process_order_id=pk)
    step_pr, attachment_pr, obj_pr = _iter_get_attachment(process=p,
                                                          **{'app_name': 'ApprovalSystemOCT',
                                                             'model_name': 'ProjectRequirement'})
    titles = ProjectImplementTitle.objects.filter(project_base=obj_pr).order_by('create_time')
    outcome = RequirementOutcomes.objects.filter(project_base=obj_pr).order_by('create_time')
    files = RequirementFiles.objects.filter(project_base=obj_pr).order_by('create_time')
    department = []
    sponsor = []
    if titles.count() > 0:
        # 进度管理中已有title
        department = ",".join(set([i.department for i in titles]))
        sponsor = ",".join(set([i.sponsor for i in titles]))
    context = {
        'template_name': "成果上传",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_types': PROJECT_TYPE,
        'project_directions': PROJECT_RESEARCH_DIRECTION,
        'process': p,
        'attachment_pr': attachment_pr,
        'obj_pr': obj_pr,
        'years': [datetime.now().year + i for i in range(-3, 3, 1)],
        'cy': datetime.now().year,
        'department': department,
        'sponsor': sponsor,
        'outcome': outcome,
        'files': files
    }
    return render(request, 'outcome.html', context)


class OutcomeListCreateView(generics.ListCreateAPIView):
    queryset = RequirementOutcomes.objects.all()
    serializer_class = RequirementOutcomesSerializer
    filter_backends = [filters.OrderingFilter]
    ordering = ['create_time']

    def get_queryset(self):
        try:
            other_param = self.request.query_params.dict()
            if "format" in other_param.keys():
                other_param.pop("format")
        except json.decoder.JSONDecodeError:
            other_param = None
        queryset = self.queryset
        if isinstance(queryset, QuerySet):
            if other_param:
                queryset = queryset.filter(**other_param)
            else:
                queryset = queryset.all()
        return queryset


class OutcomeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RequirementOutcomes.objects.all()
    serializer_class = RequirementOutcomesSerializer


## 结题
@login_required(login_url="/members/login_to_app/")
def project_ending_process(request, pk):
    p = Process.objects.get(process_order_id=pk)
    step_pr, attachment_pr, obj_pr = _iter_get_attachment(process=p,
                                                          **{'app_name': 'ApprovalSystemOCT',
                                                             'model_name': 'ProjectRequirement'})
    titles = ProjectImplementTitle.objects.filter(project_base=obj_pr).order_by('create_time')
    outcome = RequirementOutcomes.objects.filter(project_base=obj_pr).order_by('create_time')
    files = RequirementOutcomes.objects.filter(project_base=obj_pr).order_by('create_time')
    try:
        closure = ProjectClosure.objects.get(project_base=obj_pr)
    except ProjectClosure.DoesNotExist:
        closure = None

    department = []
    sponsor = []
    if titles.count() > 0:
        # 进度管理中已有title
        department = ",".join(set([i.department for i in titles]))
        sponsor = ",".join(set([i.sponsor for i in titles]))
    context = {
        'template_name': "成果上传",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_types': PROJECT_TYPE,
        'project_directions': PROJECT_RESEARCH_DIRECTION,
        'process': p,
        'attachment_pr': attachment_pr,
        'obj_pr': obj_pr,
        'years': [datetime.now().year + i for i in range(-3, 3, 1)],
        'cy': datetime.now().year,
        'department': department,
        'sponsor': sponsor,
        'outcome': outcome,
        'files': files,
        'closure': closure
    }
    return render(request, 'projectEndProcess.html', context)


class ApprovalLogListCreateView(generics.ListCreateAPIView):
    queryset = ApprovalLog.objects.all()
    serializer_class = ApprovalLogSerializer
    filter_backends = [filters.OrderingFilter]
    ordering = ['-create_time']

    def get_queryset(self):
        try:
            other_param = self.request.query_params.dict()
            if "format" in other_param.keys():
                other_param.pop("format")
        except json.decoder.JSONDecodeError:
            other_param = None
        queryset = self.queryset
        if isinstance(queryset, QuerySet):
            if other_param:
                queryset = queryset.filter(**other_param)
            else:
                queryset = queryset.all()
        return queryset


class ApprovalLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ApprovalLog.objects.all()
    serializer_class = ApprovalLogSerializer



class RequirementFilesListCreateView(generics.ListCreateAPIView):
    queryset = RequirementFiles.objects.all()
    serializer_class = RequirementFilesSerializer
    filter_backends = [filters.OrderingFilter]
    ordering = ['create_time']

    def get_queryset(self):
        try:
            other_param = self.request.query_params.dict()
            if "format" in other_param.keys():
                other_param.pop("format")
        except json.decoder.JSONDecodeError:
            other_param = None
        queryset = self.queryset
        if isinstance(queryset, QuerySet):
            if other_param:
                queryset = queryset.filter(**other_param)
            else:
                queryset = queryset.all()
        return queryset


class RequirementFilesDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RequirementFiles.objects.all()
    serializer_class = RequirementFilesSerializer


class ProjectClosureListView(generics.ListCreateAPIView):
    queryset = ProjectClosure.objects.all()
    serializer_class = ProjectClosureSerializer
    filter_backends = [filters.OrderingFilter]
    ordering = ['start_time']

    def get_queryset(self):
        try:
            other_param = self.request.query_params.dict()
            if "format" in other_param.keys():
                other_param.pop("format")
        except json.decoder.JSONDecodeError:
            other_param = None
        queryset = self.queryset
        if isinstance(queryset, QuerySet):
            if other_param:
                queryset = queryset.filter(**other_param)
            else:
                queryset = queryset.all()
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        t = ApprovalLog(
            related_model=serializer.instance,
            person_id=request.data.get('request_from'),
            action='1',
            note=request.data.get('note')
        )
        t.save()
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ProjectClosureDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProjectClosure.objects.all()
    serializer_class = ProjectClosureSerializer
