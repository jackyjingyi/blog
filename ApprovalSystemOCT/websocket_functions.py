from django.contrib.auth.models import User, Group, Permission
from ApprovalSystemOCT.serializers import UserSerializer, GroupSerializer, PermissionsSerializer

from djangochannelsrestframework import permissions
from djangochannelsrestframework.generics import GenericAsyncAPIConsumer
from djangochannelsrestframework.mixins import (
    ListModelMixin,
    PatchModelMixin,
    UpdateModelMixin,
    CreateModelMixin,
    DeleteModelMixin,
)

