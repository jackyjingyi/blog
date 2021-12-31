from django.urls import path
from django.conf.urls import url, include
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf.urls.static import static
from django.conf import settings
from .views import home_view, BookList, BookDetail, StepList, StepDetail, TaskStepList, ProjectRequirementList, \
    ProjectRequirementDetail, project_creation, display_all_projects, ProcessTypeList, ProcessTypeDetail, \
    project_settlement, process_creation, AttachmentList, requirement_transformation, my_projects, \
    get_process_type_list, ProcessListWithType, requirement_bulk_action, \
    set_to_annual_project, project_dispatch, finish_process, process_detail, update_attachment, \
    get_history_log, process_pack_up, get_requirement_content, development_process, UserViewSet, GroupViewSet, \
    user_management, PermissionViewSet, TaskTypeViewSet, UserObjectPermissionViewSet, UserObjectPermissionListView, \
    check_user_is_admin, process_dispatch, first_submit, process_deletion, ProcessListPackUP, process_re_submit, \
    project_leader_dashboard, approval_process, TaskLisCreateView, annual_project_detail1,check_information_for_group_leader
from .annual_project_view import annual_project_detail, annual_projects, project_implement, project_implement_title, \
    ImplementTitleList, ImplementTitleDetail
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"groups", GroupViewSet, basename="group")
router.register(r"permissions", PermissionViewSet, basename="permission")
router.register(r"task_type", TaskTypeViewSet, basename="task-type")
router.register(r"user-object-permission", UserObjectPermissionViewSet, basename="user-object-permission")
router.register(r"task_info", TaskLisCreateView, basename="task-object")
urlpatterns = [
                  path('', home_view, name='project_home'),
                  url(r'^projectSettlement/$', project_settlement, name='project_settlement'),
                  url(r'^attachment/$', AttachmentList.as_view()),
                  url(r'^ProjectCreation/$', project_creation, name='project_creation'),
                  url(r'^projectDetail/(?P<pk>[0-9a-f-]+)/$', process_detail, name='project_detail'),
                  url(r'^ProjectAllList/$', display_all_projects, name='display_all_projects'),
                  url(r'^ProjectAllList/myProjects/$', my_projects, name='my_projects'),
                  url(r'^transform/ProjectRequirement/$', requirement_transformation),
                  url(r'^books/$', BookList.as_view()),
                  url(r'^books/(?P<pk>[0-9]+)/$', BookDetail.as_view()),
                  url(r'^steps/$', StepList.as_view()),
                  url(r'^steps/(?P<pk>[0-9a-f-]+)/$', StepDetail.as_view()),
                  url(r"^get-user-permission/$", UserObjectPermissionListView.as_view(),
                      name="get_all_user_permission"),
                  url(r'^processTypes/$', ProcessTypeList.as_view()),
                  url(r'^processType/getInput/$', get_process_type_list),
                  url(r"^processList/$", ProcessListWithType.as_view()),
                  url(r"^processListPackUP/$", ProcessListPackUP.as_view()),
                  url(r'^process/creation/$', process_creation, name="process_creation"),
                  url(r'^processTypes/(?P<pk>[0-9]+)/$', ProcessTypeDetail.as_view()),
                  url(r'^tasks/steps/(?P<task>[0-9a-f-]+)/$', TaskStepList.as_view()),
                  url(r"^requirementBulkAction/$", requirement_bulk_action),
                  url(r"^requirementSetToAnnual/$", set_to_annual_project),
                  url(r"^annualAllProjects/$", annual_projects, name="annual_all_projects"),
                  url(r"^annualAllProjects/(?P<user>[0-9]+)$", annual_projects, name="annual_user_projects"),
                  url(r'^projectRequirements/$', ProjectRequirementList.as_view(), name="projectRequirementList"),
                  url(r'^projectRequirements/(?P<pk>[0-9]+)/$', ProjectRequirementDetail.as_view(),
                      name="projectRequirementDetail"),
                  url(r"^first-submission/$", first_submit, name="first_submit"),
                  url(r"^process-deletion/$", process_deletion, name="process_deletion"),
                  # url(r"^process-pack-up/$",process_pack_up_main_page, name="process_pack_up_main_page"),
                  url(r"^projectDispatch/$", project_dispatch),
                  url(r"^processDispatch/$", process_dispatch),
                  url(r"^project_leader_dashboard/$", project_leader_dashboard, name="project_leader_dashboard"),
                  url(r"^re-submit/$", process_re_submit),
                  url(r"^updateAttachment/$", update_attachment, name="update_attachment"),
                  url(r"^getHistoryLog/$", get_history_log),
                  url(r"^processPackUp/$", process_pack_up),
                  url(r"^get_requirement_content/$", get_requirement_content),
                  url(r"^development_process/$", development_process, name="development_process"),
                  url("^finishProcess/$", finish_process),
                  url(r"^approval-to-annual/$", approval_process),
                  url(r"^annualProjectDetail/(?P<pk>[0-9a-f-]+)/$", annual_project_detail,
                      name="annual_project_detail"),
                  url(r"^projectViewOnly/(?P<pk>[0-9a-f-]+)/$", annual_project_detail1, name="project_view_only"),
                  url(r"^Project/implementTitle/$", project_implement_title),
                  url(r"^Project/implement/(?P<pk>[0-9a-f-]+)/progress/$", project_implement,
                      name="project_implement"),
                  url(r"^Project/implementTitle/create/", ImplementTitleList.as_view()),
                  url(r"Project/implementTitle/detail/(?P<pk>[0-9a-f-]+)/", ImplementTitleDetail.as_view()),
                  url(r"^userManagement/$", user_management, name="user_management"),
                  url(r"^check-user-isadmin/$", check_user_is_admin, name="check_user_isadmin"),
                  url(r"^check_information_for_group_leader/$", check_information_for_group_leader),
                  path('', include(router.urls)),
              ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
