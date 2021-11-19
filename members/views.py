from django.shortcuts import render, redirect
from django.views import generic
from django.contrib.auth.forms import UserCreationForm
from django.urls import reverse_lazy,reverse
from django.contrib.auth.views import LoginView,LogoutView
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.debug import sensitive_post_parameters
from django.http import HttpResponseRedirect
from django.conf import settings
from django.shortcuts import resolve_url
from django.utils.http import (
    url_has_allowed_host_and_scheme, urlsafe_base64_decode,
)

class UserRegisterView(generic.CreateView):
    form_class = UserCreationForm
    template_name = 'registration/register.html'
    success_url = reverse_lazy('login')


class UserLoginView(LoginView):
    '''A LoginView with no CSRF protection.'''

    redirect_authenticated_user = True

    @method_decorator(sensitive_post_parameters())
    @method_decorator(csrf_exempt)
    @method_decorator(never_cache)
    def dispatch(self, request, *args, **kwargs):
        if self.redirect_authenticated_user and self.request.user.is_authenticated:
            redirect_to = self.get_success_url()
            if redirect_to == self.request.path:
                raise ValueError(
                    'Redirection loop for authenticated user detected. Check that '
                    'your LOGIN_REDIRECT_URL doesn\'t point to a login page.')
            return HttpResponseRedirect(redirect_to)
        return super(LoginView, self).dispatch(request, *args, **kwargs)


class ApprovalSystemOCTLoginView(LoginView):
    template_name = 'registration/login_app.html'

    @method_decorator(sensitive_post_parameters())
    @method_decorator(csrf_exempt)
    @method_decorator(never_cache)
    def dispatch(self, request, *args, **kwargs):
        if self.redirect_authenticated_user and self.request.user.is_authenticated:
            redirect_to = self.get_success_url()
            if redirect_to == self.request.path:
                raise ValueError(
                    'Redirection loop for authenticated user detected. Check that '
                    'your LOGIN_REDIRECT_URL doesn\'t point to a login page.')
            return HttpResponseRedirect(redirect_to)
        return super(LoginView, self).dispatch(request, *args, **kwargs)

    def get_success_url(self):
        url = self.get_redirect_url()
        if not url:
            url = "/projectSystem/"
        return url or resolve_url(settings.LOGIN_REDIRECT_URL)

class ApprovalSystemOCTLogoutView(LogoutView):
    next_page = "project_home"