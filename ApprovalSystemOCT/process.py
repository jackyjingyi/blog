import os
import django
import uuid
from abc import ABC, abstractmethod
from django.core.wsgi import get_wsgi_application

from datetime import datetime, date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_blog.settings')

application = get_wsgi_application()
django.setup()
import django.utils.timezone as timezone
from django.contrib.contenttypes.models import ContentType
from ApprovalSystemOCT.models import ProjectRequirement, Step, Process, Task, Attachment


class AbstractProcessFactory(ABC):
    def register(self):
        pass

    @abstractmethod
    def create_edit_process(self):
        pass

    @abstractmethod
    def create_halt_process(self):
        pass


class ProjectRequirementProcessFactory(AbstractProcessFactory):
    def create_edit_process(self):
        return ProjectInputProcess()

    def create_halt_process(self):
        return "s"


class AbstractProcess(ABC):

    @abstractmethod
    def process_authorization_check(self, *args, **kwargs):
        pass

    @abstractmethod
    def process_creation(self):
        pass

    @abstractmethod
    def process_attach(self, collaborator):
        pass

    @abstractmethod
    def process_create_task(self):
        pass

    @abstractmethod
    def process_get_tasks(self):
        pass


class ProjectInputProcess(AbstractProcess):
    """
        课题录入编辑流程
    """
    process_name = "课题录入"
    process_description = "组长录入课题"
    process_pattern = ""
    process_type = "create"
    process_instance = None

    def process_authorization_check(self, *args, **kwargs):
        user = kwargs.get('user')
        user_group = kwargs.get('group')
        return user in user_group

    def process_creation(self, *args, **kwargs):
        # process
        instance = kwargs.get('instance')
        if self.process_date_validator(instance=instance):
            task_demo = instance.create_task(
                task_type='录入',
                task_seq=0,
                task_status='processing',
                task_state='',
                task_sponsor=instance.process_executor
            )
            return task_demo


    def process_date_validator(self, instance):
        current_date = timezone.now()
        # datetime
        return instance.process_pattern.process_start_time < current_date < instance.process_pattern.process_end_time

    def process_attach(self, collaborator):
        return

    def process_create_task(self, **kwargs):
        return Task.objects.create(**kwargs)

    def process_get_tasks(self):
        return Task.get_tasks(self.process_instance.id)


class Book:
    name = None
    author = None

    def __call__(self, *args, **kwargs):
        self.id = uuid.uuid4()
        self.name = kwargs.get('name')
        self.author = kwargs.get('author')

    def __str__(self):
        return f"id :{self.id}, book name :{self.name}, author :{self.author}"


class Order:
    title = None
    client = None
    product = None
    amount = 0

    def __call__(self, *args, **kwargs):
        self.id = uuid.uuid4()
        self.title = kwargs.get('title')
        self.client = kwargs.get('client')
        self.product = kwargs.get('product')
        self.amount = kwargs.get('amount')

    def __str__(self):
        return f"id: {self.id}, title : {self.title}, client: {self.client}, product : {self.product}, amount : {self.amount}"


class AbstractAttachment(ABC):
    attachment = None

    @abstractmethod
    def set_attachment(self, attachment):
        pass

    @abstractmethod
    def get_attachment(self):
        pass

    @abstractmethod
    def persistence(self):
        pass


class BookAttachment(AbstractAttachment):

    def set_attachment(self, attachment):
        self.attachment = attachment

    def get_attachment(self):
        return self.attachment

    def persistence(self):
        pass


class OrderAttachment(AbstractAttachment):
    def set_attachment(self, attachment):
        self.attachment = attachment

    def get_attachment(self):
        return self.attachment

    def persistence(self):
        pass


class ProjectRequirementAttachment(AbstractAttachment):
    def set_attachment(self, attachment):
        self.attachment = attachment

    def get_attachment(self):
        return self.attachment

    def __str__(self):
        return f"{self.attachment}"

    def persistence(self):
        if self.attachment:
            project_attachment = Attachment.objects.create(attachment_app_name=self.attachment._meta.app_label,
                                                           attachment_app_model=self.attachment._meta.object_name,
                                                           attachment_identify=self.attachment.pk)
            return project_attachment


def attachment_creation(attachment_class, stuff):
    print("create attachment")
    attachment = attachment_class
    attachment.set_attachment(attachment=stuff)
    return attachment


if __name__ == '__main__':
    a_book = Book()
    a_book(name='python', author='jack')
    print(a_book)
    a_book_attachment = BookAttachment()
    a_book_attachment = attachment_creation(a_book_attachment, a_book)
    print(type(a_book_attachment))
    print(a_book_attachment.get_attachment())
    an_order = Order()
    an_order(title="an order", client="jack", product=a_book, amount=100)
    print(an_order)
    an_order_attachment = OrderAttachment()
    an_order_attachment = attachment_creation(an_order_attachment, an_order)
    print(type(an_order_attachment))
    print(an_order_attachment.get_attachment())

    print("django test")
    p = ProjectRequirement.objects.all()[0]

    a_project_attachment = ProjectRequirementAttachment()
    a_project_attachment = attachment_creation(a_project_attachment, p)
    print(type(a_project_attachment))
    print(a_project_attachment.get_attachment(), type(a_project_attachment.get_attachment()))
    z = a_project_attachment.get_attachment()
    print(type(z.__class__), z.__class__)
    print(ContentType.objects.get_for_model(z))
    print(type(z._meta.app_label), type(z._meta.object_name))
    zeta = a_project_attachment.persistence()
    print(zeta, zeta.get_attachment())
