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
from django.db.models import Func, Value
import django.utils.timezone as timezone
from django.views.decorators.csrf import csrf_exempt
from ApprovalSystemOCT.project_statics.static_data import *
from rest_framework.pagination import PageNumberPagination
from rest_framework import generics

import docx

from ApprovalSystemOCT.models import Process, Task, Step, Book, ProcessType, Attachment, ProjectRequirement, \
    PROJECT_TYPE, \
    PROJECT_RESEARCH_DIRECTION, PROJECT_REQUIREMENT_VERBOSE, PROCESS_TYPE
from ApprovalSystemOCT.serializers import BookSerializer, StepSerializer, ProjectRequirementSerializer, \
    ProcessTypeSerializer, AttachmentSerializer, ProcessSerializer
from ApprovalSystemOCT.process import ProjectInputProcess
from ApprovalSystemOCT.docx_handler import ProjectTableHandler
from ApprovalSystemOCT.project_statics.static_function import *

logger = logging.getLogger(__name__)
collect_logger = logging.getLogger("collect")


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


def home_view(request):
    p1 = Process.objects.all()
    context = {
        'book': Book.objects.get(id=1),
        'process': p1,
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'time_interval': TIME_INTERVAL,
        'status_list': STATUS_LIST
    }
    logger.info("hi")
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
    queryset = Process.objects.filter(status__in=['3', '8'], process_pattern__process_type="1")
    already_set_to_annual = []
    not_set_to_annual = []

    for i in queryset:
        pnext = i.get_next()

        if pnext:
            tmp = False

            for k in pnext:
                _k = Process.objects.get(pk=k)

                if _k.process_pattern.process_type == '7':
                    tmp = True
            if tmp:
                already_set_to_annual.append(i.pk)
            else:
                not_set_to_annual.append(i.pk)
        else:
            not_set_to_annual.append(i.pk)

    al = Process.objects.filter(process_order_id__in=already_set_to_annual)
    nal = Process.objects.filter(process_order_id__in=not_set_to_annual)
    context = {
        'template_name': "所有课题",
        'sidebar_index': BASE_SIDEBAR_INDEX,
        'project_verbose_name': json.dumps(PROJECT_REQUIREMENT_VERBOSE),
        'queryset': queryset,
        'al': al,
        'nal': nal,
        'project_type': json.dumps(PROJECT_TYPE[1:]),
        'process_directions': json.dumps(PROJECT_RESEARCH_DIRECTION[1:]),
    }
    logging.info(f"Here goes {123}")
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
    user_set = User.objects.filter(groups=15).extra(
        select={'convert_name': 'convert(first_name using gbk)'},
        order_by=['convert_name']
    )
    user_set_chief = User.objects.filter(groups__name="课题负责领导").extra(
        select={'convert_name': 'convert(first_name using gbk)'},
        order_by=['convert_name']
    )

    def get_form(user_set, user_set_chief):
        def _get_user_selection(option, target):
            users = ""
            if target:
                for u in target:
                    users += option(u.first_name, value=u.id)
            return users

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
        users = _get_user_selection(option, user_set)
        assignee = select_tag(users, cls_property="form-control", id="project_sponsor", name="project_sponsor")
        div_row1_col1 = div(assignee_label + assignee, cls_property="col-md-6")
        users_chief = _get_user_selection(option, user_set_chief)
        label_chief = label("课题负责领导", fortag="project_head_master")
        input_chief = select_tag(users_chief, cls_property="form-control", id="project_head_master",
                                 name="project_head_master")
        div_row1_col2 = div(label_chief + input_chief, cls_property="col-md-6")

        div_row1 = div(div_row1_col1 + div_row1_col2, cls_property="row margin-top-5")
        # row 2
        label_settle_time = label("立项时间", fortag="project_approval_time")
        project_approval_time = input_tag(value=datetime.strftime(datetime.now(), "%Y年%m月%d日"),
                                          cls_property="form-control",
                                          id="project_approval_time", name="project_approval_time", disabled="disabled")
        div_row2_col1 = div(label_settle_time + project_approval_time, cls_property="col-md-6")
        div_row2 = div(div_row2_col1, cls_property="row margin-top-5")
        # row3
        label_company = label("外部合作单位", fortag="project_outsourcing_companies_0")
        input_company = input_tag(name="project_outsourcing_companies_0", cls_property="form-control companies",
                                  id="project_outsourcing_companies_0", )
        div_row3_col1 = div(label_company + input_company, cls_property="col-md-6")

        label_company_purpose = label("外部合作内容", fortag="project_outsourcing_info_0")
        input_company_purpose = input_tag(name="project_outsourcing_info_0", cls_property="form-control companies_info",
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

    res = get_form(user_set, user_set_chief)
    return JsonResponse({'html': res}, status=200, safe=False)


def get_history(task_id):
    history = []
    for idx, val in enumerate(Step.get_update_history(task_id=task_id), start=1):
        _k = list(val.keys())[0]
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
                before = PROJECT_RESEARCH_DIRECTION[int(val[_k].get("before"))][1]
                after = PROJECT_RESEARCH_DIRECTION[int(val[_k].get("after"))][1]
            history.append(
                (idx, datetime.strftime(val[_k].get("update_time"), "%Y年%m月%d日 %H:%M:%S"), val[_k].get("step_owner"),
                 PROJECT_REQUIREMENT_VERBOSE[_k],
                 before, after
                 ))
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
    # process_conjunction processConjunction/
    # ship new process, buckets [uuid1:str, uuid2:str]
    # TODO: admin need a default input process type without influenced by time

    def _check_validation(b):
        try:
            Process.objects.get(pk=b)
        except Process.DoesNotExist:
            return False
        finally:
            return True

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
        process_type_queryset = ProcessType.objects.filter(process_type='1',
                                                           status='1')  # 管理员不受时间限制

        pc = ProjectInputProcess()
        np, init_task = pc.process_creation(process_pattern_id=process_type_queryset.first().id,
                                            process_executor=request.user)

        _prev = []
        _attachments = []
        for i in data:
            i = json.loads(i)
            logging.info(f"Iterating target {i}")
            p = Process.objects.get(pk=i.get('process_id'))
            p.set_conjunction([json.loads(j).get('process_id') for j in data if
                               json.loads(j).get('process_id') != i.get('process_id')])
            p.status = '8'
            # 上线取消注释
            p.read_only = '1'
            p.set_next([str(np.process_order_id)])
            _prev.append(str(p.process_order_id))
            _attachments.append(i.get("attachment_id"))
            p.save()
        np.set_prev(_prev)

        np.save()
        prd = {}
        prpinstance = ProjectRequirement.objects.get(pk=_attachments[0])
        for i in prpinstance._meta.fields:
            if i.name != 'id':
                prd[i.name] = getattr(prpinstance, i.name)
        print(prd)
        rp = ProjectRequirement.objects.create(
            **prd
        )
        at = Attachment.objects.create(
            attachment_app_name='ApprovalSystemOCT',
            attachment_app_model='ProjectRequirement',
            attachment_identify=rp.pk,
        )
        st = Step.objects.create(
            task=init_task,
            step_type='1',
            step_owner=request.user.id,
            step_attachment=at,
            step_status='3',
            step_seq=0,
        )
        st.set_attachment_snapshot()
        url = f'/projectSystem/projectDetail/{str(np.process_order_id)}/'
        return JsonResponse({'url': url, 'atc': st.step_attachment_snapshot}, status=200, safe=False)


@csrf_exempt
def get_requirement_content(request):
    if request.method == 'POST':
        p = Process.objects.get(pk=request.POST.get('process_id'))
        ar = p.get_tasks().last().get_steps().last().step_attachment.get_attachment().first()
        _info = ProjectRequirement.objects.values().get(pk=ar.pk)

        return JsonResponse({'info': _info, 'html': ar.__str__()}, status=200, safe=False)


@login_required(login_url="/memebers/login_to/")
def process_detail(request, pk):
    p = Process.objects.get(process_order_id=pk)
    attachment = p.get_tasks().last().get_steps().last().step_attachment
    history = get_history(task_id=p.get_tasks().last().pk)
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
        'project_verbose_name': PROJECT_REQUIREMENT_VERBOSE,
        'user_process': _get_processlist('1'),
        'user_process_sub': _get_processlist('3'),
        'project_types': PROJECT_TYPE[1:],
        'process_directions': PROJECT_RESEARCH_DIRECTION[1:]
    }

    return render(request, 'projectMyprojects.html', context=context)


@csrf_exempt
def update_attachment(request):
    # url update_attachment
    if request.method == 'POST':
        _p = Process.objects.get(pk=request.POST.get("process_id"))
        _a = Attachment.objects.get(pk=request.POST.get("attachment_id"))
        _t = _p.get_tasks().last()
        _max_seq = _t.get_steps().last().step_seq + 1
        _s = Step.objects.create(
            task=_t,
            step_seq=_max_seq,
            step_owner=request.user.pk,
            step_status='3',  # 变更结束
            step_type='3',  # edit
            step_attachment=_a,
        )

        _s.set_attachment_snapshot()
        history = get_history(task_id=_t.task_id)
        context = {
            'new_history': history,
            'new_step_snapshot': _s.step_attachment_snapshot
        }
        return JsonResponse(context, status=200, safe=False)


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
                    target_task = process.get_tasks().last()
                    # task_type == input
                    # 本步骤不改变attachment

                    last_steps = target_task.get_steps().order_by('step_seq').order_by('step_update_time')
                    last_step = last_steps.last()
                    seq = last_step.step_seq + 1
                    attachment = last_step.step_attachment
                    s = StepSerializer(data={
                        'step_attachment': attachment.attachment_uuid,
                        'task': target_task.task_id,
                        'step_seq': seq,
                        'step_attachment_snapshot': {},
                        'step_owner': request.user.id,
                        'step_status': '3'}
                    )
                    s.is_valid(raise_exception=True)

                    s.save()
                    # 2 提交、审批
                    s.instance.set_attachment_snapshot()
                    s.instance.step_type = '2'
                    s.instance.save()
                    target_task.task_status = '3'
                    process.status = '3'
                    target_task.save()
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
        # create type is 1 <input>
        serializer.instance.step_type = '1'
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
