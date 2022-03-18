from django.contrib import admin
from .models import Attachment, Task, Process, Step, ProcessType, ProjectRequirement, ProjectImplement, TaskType, \
    ProjectDirection, ProjectImplementTitle, ProjectClosure,ApprovalLog

admin.site.register(Attachment)
admin.site.register(Task)
admin.site.register(Process)
admin.site.register(Step)
admin.site.register(ProcessType)
admin.site.register(ProjectRequirement)
admin.site.register(ProjectImplement)
admin.site.register(TaskType)
admin.site.register(ProjectDirection)
admin.site.register(ProjectImplementTitle)
admin.site.register(ProjectClosure)
admin.site.register(ApprovalLog)
