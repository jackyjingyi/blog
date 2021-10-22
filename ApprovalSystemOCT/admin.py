from django.contrib import admin
from .models import Attachment, Task, Process, Step, ProcessType, ProjectRequirement

admin.site.register(Attachment)
admin.site.register(Task)
admin.site.register(Process)
admin.site.register(Step)
admin.site.register(ProcessType)
admin.site.register(ProjectRequirement)
