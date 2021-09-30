from django.contrib import admin
from .models import Attachment, Task, Process, Step

admin.site.register(Attachment)
admin.site.register(Task)
admin.site.register(Process)
admin.site.register(Step)
