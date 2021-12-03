from django.urls import path
from django.conf.urls import url,include
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf.urls.static import static
from django.conf import settings
from .views import home_view, BookList, BookDetail, StepList, StepDetail, TaskStepList, ProjectRequirementList, \
    ProjectRequirementDetail, project_creation, display_all_projects, ProcessTypeList, ProcessTypeDetail, \
    project_settlement, process_creation, AttachmentList, requirement_transformation, my_projects, \
    get_process_type_list, ProcessListWithType, requirement_bulk_action, \
    set_to_annual_project, project_dispatch, finish_process, process_detail, update_attachment, \
    get_history_log, process_pack_up, get_requirement_content, development_process, UserViewSet,GroupViewSet, user_management
from .annual_project_view import annual_project_detail, annual_projects, project_implement, project_implement_title, \
    ImplementTitleList, ImplementTitleDetail
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"groups", GroupViewSet, basename="group")
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
                  url(r'^processTypes/$', ProcessTypeList.as_view()),
                  url(r'^processType/getInput/$', get_process_type_list),
                  url(r"^processList/$", ProcessListWithType.as_view()),
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
                  url(r"^projectDispatch/$", project_dispatch),
                  url(r"^updateAttachment/$", update_attachment, name="update_attachment"),
                  url(r"^getHistoryLog/$", get_history_log),
                  url(r"^processPackUp/$", process_pack_up),
                  url(r"^get_requirement_content/$", get_requirement_content),
                  url(r"^development_process/$", development_process, name="development_process"),
                  url("^finishProcess/$", finish_process),
                  url(r"^annualProjectDetail/(?P<pk>[0-9a-f-]+)/$", annual_project_detail,
                      name="annual_project_detail"),
                  url(r"^Project/implementTitle/$", project_implement_title),
                  url(r"^Project/implement/(?P<pk>[0-9a-f-]+)/progress/$", project_implement,
                      name="project_implement"),
                  url(r"^Project/implementTitle/create/", ImplementTitleList.as_view()),
                  url(r"Project/implementTitle/detail/(?P<pk>[0-9a-f-]+)/", ImplementTitleDetail.as_view()),
                  url(r"userManagement/$",user_management,name="user_management"),
                  path('', include(router.urls)),
              ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

