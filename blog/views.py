from django.shortcuts import render
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from .models import Post, Category, Source, Profile
from .forms import PostForm, EditForm
from django.urls import reverse_lazy, reverse
from django.contrib.auth.models import User
from django.http import HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from functools import reduce
from operator import and_


class HomeView(ListView):
    model = Post
    template_name = 'home.html'
    ordering = ['-post_date']

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        source_menu = Source.objects.all()
        context = super(HomeView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        context["source_menu"] = source_menu
        return context


class ApprovalPosts(ListView):
    """
      基于Approver自身的审批等级进行筛选
        1. 本view对post进行简单展示，并非审批功能view
    """
    model = Post
    template_name = 'approval_list.html'

    def get_queryset(self):

        if not self.request.user.is_staff:
            profile_role = Profile.objects.get(user=self.request.user)
            if profile_role.is_lv1_approver:
                return Post.objects.filter(lv1_approval_status='1')
            elif profile_role.is_lv2_approver:
                return Post.objects.filter(lv2_approval_status='1')
            elif profile_role.is_lv3_approver:
                return Post.objects.filter(lv3_approval_status='1')

        else:
            return super().get_queryset()


class ApprovalSuccessDetailView(DetailView):
    model = Post
    template_name = 'approval_success_update.html'

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        context = super(ApprovalSuccessDetailView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        return context

    def get_object(self, queryset=None):
        obj = super().get_object(queryset=queryset)
        print(obj)
        user = self.request.user
        profile = Profile.objects.get(user=user)
        # update post
        # first confirm approver's lv
        if not user.is_staff:  # not a system manager
            if profile.is_lv1_approver:
                obj.approval_positive(1, user.pk)
            elif profile.is_lv2_approver:
                obj.approval_positive(2, user.pk)
            elif profile.is_lv3_approver:
                obj.approval_positive(3, user.pk)
            else:
                raise ValueError
        else:
            # TODO:check current post status
            obj.approval_positive(1)
        return obj


class ApprovalDenyDetailView(DetailView):
    model = Post
    template_name = 'approval_deny_update.html'

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        context = super(ApprovalDenyDetailView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        return context

    def get_object(self, queryset=None):
        obj = super().get_object(queryset=queryset)
        print(obj)
        user = self.request.user
        profile = Profile.objects.get(user=user)
        # update post
        # first confirm approver's lv
        if not user.is_staff:  # not a system manager
            if profile.is_lv1_approver:
                obj.approval_deny(1, user.pk)
            elif profile.is_lv2_approver:
                obj.approval_deny(2, user.pk)
            elif profile.is_lv3_approver:
                obj.approval_deny(3, user.pk)
            else:
                raise ValueError
        else:
            # TODO:check current post status
            obj.approval_deny(1)
        return obj

def category_view(request, *args, **kwargs):
    # query categories from db
    cats = kwargs['cats']
    category_posts = Post.objects.filter(category=cats)
    cat_menu = Category.objects.all()
    return render(request, 'categories.html', {'cats': cats, 'category_posts': category_posts, 'cat_menu': cat_menu})


def author_posts_view(request, author):
    # 基于上传者统计
    author_posts = Post.objects.filter(author__username=author)
    author = User.objects.get(username=author)
    return render(request, 'author_posts.html', {'author_posts': author_posts, 'author': author})


def source_posts_view(request, source):
    source_posts = Post.objects.filter(source=source)
    cnt = 0
    for i in source_posts:
        cnt += i.views
    return render(request, 'source_posts.html', {'source_posts': source_posts, 'source': source, 'cnt': cnt})


class SubmitPostDetailView(DetailView):
    model = Post
    template_name = 'submit_post.html'

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        context = super(SubmitPostDetailView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        return context

    def get_object(self, queryset=None):
        obj = super().get_object(queryset=queryset)
        obj.submit()
        return obj


class ArticleDetailView(DetailView):
    model = Post
    template_name = 'article_detail.html'

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        context = super(ArticleDetailView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        return context

    def get_object(self, queryset=None):
        obj = super().get_object(queryset=queryset)
        obj.increase_views()
        return obj


class AddPostView(CreateView):
    model = Post
    form_class = PostForm
    template_name = 'add_post.html'

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        publishers = [p.user_id for p in Profile.objects.filter(is_publisher=True)]

        context = super(AddPostView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        context['publishers'] = publishers
        return context


class UpdatePostView(UpdateView):
    model = Post
    form_class = EditForm
    template_name = 'update_post.html'

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        context = super(UpdatePostView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        return context


class DeletePostView(DeleteView):
    model = Post
    template_name = 'delete_post.html'
    success_url = reverse_lazy('home')

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        context = super(DeletePostView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        return context


class AddCategoryView(CreateView):
    model = Category
    template_name = 'add_post.html'

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        context = super(AddCategoryView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        return context
