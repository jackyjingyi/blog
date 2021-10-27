from django.urls import path
from django.conf.urls import url
from django.conf.urls.static import static
from django.conf import settings
from rest_framework.urlpatterns import format_suffix_patterns
from .views import home_view, BookList, BookDetail, StepList, StepDetail, TaskStepList, ProjectRequirementList, \
    ProjectRequirementDetail, project_creation, display_all_projects, ProcessTypeList, ProcessTypeDetail, \
    project_settlement, process_creation, AttachmentList, requirement_transformation, my_projects, \
    get_process_type_list, ProcessListWithType

urlpatterns = [
                  path('', home_view, name='project_home'),
                  url(r'^projectSettlement/$', project_settlement, name='project_settlement'),
                  url(r'^attachment/$', AttachmentList.as_view()),
                  url(r'^ProjectCreation/$', project_creation, name='project_creation'),
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
                  url(r'^projectRequirements/$', ProjectRequirementList.as_view(), name="projectRequirementList"),
                  url(r'^projectRequirements/(?P<pk>[0-9]+)/$', ProjectRequirementDetail.as_view(),
                      name="projectRequirementDetail"),
              ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns = format_suffix_patterns(urlpatterns)
