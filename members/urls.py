from django.contrib import admin
from django.urls import path
from .views import UserRegisterView,UserLogingView

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='register'),
    path('login_to/',UserLogingView.as_view(), name='login'),
]
