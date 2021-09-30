import os, django
from django.test import TestCase

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')

application = get_wsgi_application()
django.setup()

from ApprovalSystemOCT.models import Step


if __name__ == '__main__':
    print(Step.objects.all())
