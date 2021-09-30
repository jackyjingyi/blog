from django.shortcuts import render
from django.http import HttpResponse, Http404
from django.core import serializers
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser
from rest_framework import mixins
from rest_framework import generics
from ApprovalSystemOCT.models import Process, Task, Step, Book, Attachment
from ApprovalSystemOCT.serializers import BookSerializer


def home_view(request):
    p1 = Process.objects.all()[0]
    t1 = Task.get_tasks(process_id=p1.process_order_id)
    s1 = [Step.display_steps(task_id=i.task_id) for i in t1]
    context = {
        'book': Book.objects.get(id=1),
        'process': p1,
        'task': t1,
        'step': s1,
    }
    return render(request, 'projectHome.html', context=context)


class BookList(generics.ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer


class BookDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
