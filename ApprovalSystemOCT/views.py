import os
import json
import timeit
from datetime import datetime

from django.shortcuts import render
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import permission_required, login_required
from django.http import HttpResponseRedirect, JsonResponse
from django.http import HttpResponse, Http404
from django.core import serializers
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
from rest_framework import generics
import docx
from docx.document import Document
from ApprovalSystemOCT.models import Process, Task, Step, Book, ProcessType, Attachment, ProjectRequirement, \
    PROJECT_TYPE, \
    PROJECT_RESEARCH_DIRECTION, PROJECT_REQUIREMENT_VERBOSE, PROCESS_TYPE
from ApprovalSystemOCT.serializers import BookSerializer, StepSerializer, ProjectRequirementSerializer, \
    ProcessTypeSerializer, AttachmentSeriablizer
from ApprovalSystemOCT.process import ProjectInputProcess
from ApprovalSystemOCT.docx_handler import TableHandler, ProjectTableHandler

BASE_SIDEBAR_INDEX = {
    "课题需求": {
        "general": [("课题录入", "project_creation"), ("我的课题", "my_projects")],
        "administrator": [("所有课题", "display_all_projects"), ("创建录入流程", "project_settlement")],
    },
    "立项课题": {
        "general": [("我的立项课题", "project_creation")],
        "administrator": [("所有立项课题", "project_creation")],
    },
}


def home_view(request):
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


#
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
    queryset = ProjectRequirement.objects.all()
    context = {
        'template_name': "所有课题",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'queryset': queryset,
    }

    return render(request, 'projectAllprojects.html', context=context)


def project_settlement(request):
    context = {
        'template_name': "创建录入流程",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'users': User.objects.filter(groups__in=Group.objects.filter(pk=14)),
        'process_types': PROCESS_TYPE,
    }
    return render(request, 'projectSettlment.html', context=context)


@csrf_exempt
def requirement_transformation(request):
    if request.method == 'POST':
        requirement_id = request.POST['requirement_id']
        requirement = ProjectRequirement.objects.values().get(pk=requirement_id)
        path = os.path.join(settings.MEDIA_ROOT, 'template_doc1.docx')
        s = timeit.default_timer()
        document = docx.Document(path)
        tb = document.tables[0]
        tbh = ProjectTableHandler()
        tbh(table=tb)
        tbh.dispatch(requirement)
        t = datetime.strftime(timezone.now(),'%Y-%m-%d_%H-%M-%S')
        new_file = os.path.join(settings.MEDIA_ROOT, f"docx/{requirement['project_name']}_{requirement['id']}_{t}.docx")
        document.save(new_file)
        requirement['docx'] = os.path.join(settings.MEDIA_URL, f"docx/{requirement['project_name']}_{requirement['id']}_{t}.docx")
        e=timeit.default_timer()
        print(e-s)
        return JsonResponse(requirement, status=200, safe=False)

def get_users_process(request):
    if request.method == "POST":
        process_queryset = Process.objects.filter(process_executor=request.user)
        pass

@login_required(login_url='/memebers/login_to/')
def my_projects(request):
    context = {
        'template_name': "所有课题",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),

    }
    return render(request, 'projectMyprojects.html', context=context)

@csrf_exempt
@login_required
@permission_required('ApprovalSystemOCT.add_projectrequirement')
def process_creation(request):
    if request.method == 'POST':
        try:
            p = Process.objects.create(
                process_pattern_id=5,
                process_executor=request.user,
            )
            pc = ProjectInputProcess()
            init_task = pc.process_creation(instance=p)
        except Exception as e:
            print(e, type(e))
            return JsonResponse({'msg': 'sth goes wrong'}, safe=False)
        context = {
            'process': list(Process.objects.filter(pk=p.process_order_id).values()),
            'task': list(Task.objects.filter(pk=init_task.task_id).values()),
        }
        return JsonResponse(context, status=200, safe=False)


@csrf_exempt
def step_creation(request):
    if request.method == 'POST':
        ct = Task.objects.get(pk=request.POST.task_id)
        print(ct)
        return JsonResponse({'msg': 'ok'}, status=200, safe=False)


class ProcessTypeList(generics.ListCreateAPIView):
    queryset = ProcessType.objects.all()
    serializer_class = ProcessTypeSerializer

    def perform_create(self, serializer):
        serializer.save()
        print(self.request.data)


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
    serializer_class = AttachmentSeriablizer


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
