from django.contrib import admin
from django.urls import path
from .views import UserRegisterView, UserLoginView, ApprovalSystemOCTLoginView, ApprovalSystemOCTLogoutView

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='register'),
    path('login_to/', UserLoginView.as_view(), name='login'),
    path('login_to_app/', ApprovalSystemOCTLoginView.as_view(), name='login_app'),
    path('logout_to_app/', ApprovalSystemOCTLogoutView.as_view(), name='logout_app'),
]
