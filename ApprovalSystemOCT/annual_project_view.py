import logging
import os
import json
from datetime import datetime

from django.shortcuts import render
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import permission_required, login_required
from django.http import JsonResponse
from django.http import Http404
from django.conf import settings
import django.utils.timezone as timezone
from django.views.decorators.csrf import csrf_exempt
from ApprovalSystemOCT.project_statics.static_data import *
from rest_framework.pagination import PageNumberPagination
from rest_framework import generics


from ApprovalSystemOCT.models import Process, Task, Step, Attachment, ProjectImplement,ProjectImplementTitle
from ApprovalSystemOCT.project_statics.static_data import *
from ApprovalSystemOCT.serializers import ProjectImplementTitleSerializer
from ApprovalSystemOCT.views import get_attr_from_status_state

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
        print(user)
        query_set = Process.objects.filter(process_pattern__process_type=get_attr_from_status_state("process","type","annual"), process_owner=request.user).exclude(process_state=get_attr_from_status_state("process","state","delete"))
    else:
        query_set = Process.objects.filter(process_pattern__process_type=get_attr_from_status_state("process","type","annual")).exclude(process_state=get_attr_from_status_state("process","state","delete"))
    res = {}
    print(query_set)

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


def project_implement(request, pk):
    p = Process.objects.get(process_order_id=pk)
    step_pr, attachment_pr, obj_pr = _iter_get_attachment(process=p,
                                                          **{'app_name': 'ApprovalSystemOCT',
                                                             'model_name': 'ProjectRequirement'})
    step, attachment, obj = _iter_get_attachment(process=p,
                                                 **{'app_name': 'ApprovalSystemOCT',
                                                    'model_name': 'ProjectImplementTitle'})

    context = {
        'template_name': "课题详情",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_types': PROJECT_TYPE,
        'project_directions': PROJECT_RESEARCH_DIRECTION,
        'process': p,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'attachment_pr': attachment_pr,
        'obj_pr': obj_pr
    }
    if not step and not attachment and not obj:
        # None, None, None; create simple inputs table
        context['new_creation'] = True
        logging.warning(f"Current Process {p.pk} does not contains any Attachment!")
    else:
        implement_list = ProjectImplement.objects.filter(project_base=obj)
        context['attachment'] = attachment
        context['implement_obj'] = obj
        context['new_creation'] = False
        if implement_list:
            context['implement_list'] = implement_list
    return render(request, 'projectImplement.html', context=context)


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


def project_implement_title(request):
    pass


class ImplementTitleList(generics.ListCreateAPIView):
    # url: implement_title_list
    queryset = ProjectImplementTitle.objects.all()
    serializer_class = ProjectImplementTitleSerializer


class ImplementTitleDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProjectImplementTitle.objects.all()
    serializer_class = ProjectImplementTitleSerializer
