import logging
from django.shortcuts import render, get_object_or_404
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from .models import Post, Category, Source, Profile
from .forms import PostForm, EditForm
from django.urls import reverse_lazy, reverse
from django.contrib.auth.models import User, Group, AnonymousUser
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponseRedirect, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.template.loader import render_to_string
import json
from django.db.models import Q, Max
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.utils import timezone
from functools import reduce
from operator import and_


def get_role_lv(request):
    user = request.user
    profile = Profile.objects.get(user=user)
    lv = -1
    if not user.is_staff:  # not a system manager
        if profile.is_lv1_approver:
            lv = 1
        elif profile.is_lv2_approver:
            lv = 2
        elif profile.is_lv3_approver:
            lv = 3
    return lv


def get_user_role(user):
    if not isinstance(user, AnonymousUser):
        role = Profile.objects.get(user=user)
    else:
        return '3'
    return role.role


class HomeView(ListView):
    model = Post
    template_name = 'home.html'
    ordering = ['-post_date']

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        source_menu = Source.objects.all()
        post_group = {i.name: Post.objects.filter(category=i.name, status=2).order_by('-post_date') for i in cat_menu if
                      Post.objects.filter(category=i.name, status=2)}
        likes_rating = Post.objects.aggregate(Max('likes'))['likes__max']
        hot_article = Post.objects.get(likes=likes_rating)
        top_two_topics = sorted(post_group.items(), key=lambda x: x[1].count(), reverse=True)
        print(top_two_topics)
        context = super(HomeView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        context["source_menu"] = source_menu
        context["post_group"] = post_group
        context['role'] = get_user_role(self.request.user)
        context['hot_article'] = hot_article
        context['top_two_topics'] = top_two_topics
        print(hot_article)
        return context


class ApprovalPosts(LoginRequiredMixin, ListView):
    """
      基于Approver自身的审批等级进行筛选
        1. 本view对post进行简单展示，并非审批功能view
    """
    model = Post
    template_name = 'approval_list.html'

    def get_queryset(self):
        """
        1. 判断用户角色为审批人, 返回由他负责审批的post
        """
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

    def get_context_data(self, *args, object_list=None, **kwargs):
        """
        返回由该审批人审批过的post
        由于各级审批人无重叠，直接使用or进行filter
        """
        user = self.request.user
        user_id = user.id
        cat_menu = Category.objects.all()
        approved_list_by_user = Post.objects.filter(
            Q(lv1_approver=user_id) | Q(lv2_approver=user_id) | Q(lv3_approver=user_id))
        context = super(ApprovalPosts, self).get_context_data(*args, **kwargs)
        context['approved_list_by_user'] = approved_list_by_user
        context['current'] = timezone.now()
        context['role'] = get_user_role(self.request.user)
        context["cat_menu"] = cat_menu
        return context


def search_item(request):
    if request.method == "POST":
        searched = request.POST['searched']
        obj_list = []
        for obj in Post.objects.filter(status=2):
            if searched in obj.body or searched in obj.title:
                obj_list.append(obj.pk)
        if obj_list:
            results = Post.objects.filter(id__in=obj_list)
        else:
            results = Post.objects.none()
        return render(request, 'search_items.html', {'searched_post': results})


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
    category_posts = Post.objects.filter(category=cats, status=2)
    cat_menu = Category.objects.all()
    return render(request, 'categories.html', {'cats': cats, 'category_posts': category_posts, 'cat_menu': cat_menu})


@login_required
def author_posts_view(request, author):
    # 基于上传者统计
    # author_posts = Post.objects.filter(author__username=author)

    author = User.objects.get(username=author)
    # 草稿
    author_draft = Post.objects.filter(author__username=author, status=1).order_by('-post_date')
    author_published = Post.objects.filter(author__username=author, status=2).order_by('-publish_date')
    author_submitted = Post.objects.filter(author__username=author,
                                           status_id__in=[i for i in [3, 4, 5, 6, 7, 8, 10]]).order_by(
        '-submit_time')
    role = get_user_role(request.user)
    # draft pagination
    author_draft_paginator = Paginator(author_draft, 20)
    page_draft = request.GET.get('page_draft', 1)
    try:
        draft_page_obj = author_draft_paginator.get_page(page_draft)
    except PageNotAnInteger:
        draft_page_obj = author_draft_paginator.page(1)
    except EmptyPage:
        draft_page_obj = author_draft_paginator.page(author_draft_paginator.num_pages)

    is_draft_paginated = True if author_draft_paginator.num_pages >= 1 else False
    draft_page_range = author_draft_paginator.get_elided_page_range(page_draft, on_each_side=3, on_ends=2)

    # published pagination
    author_published_paginator = Paginator(author_published, 20)
    page_pub = request.GET.get('page_pub', 1)
    try:
        pub_page_obj = author_published_paginator.get_page(page_pub)
    except PageNotAnInteger:
        pub_page_obj = author_published_paginator.get_page(1)
    except EmptyPage:
        pub_page_obj = author_published_paginator.page(author_published_paginator.num_pages)

    is_pub_paginated = True if author_published_paginator.num_pages >= 1 else False
    published_page_range = author_published_paginator.get_elided_page_range(page_pub, on_each_side=3, on_ends=2)

    # approving pagination
    author_approving_paginator = Paginator(author_submitted, 20)
    page_app = request.GET.get('page_pub', 1)
    try:
        app_page_obj = author_approving_paginator.get_page(page_pub)
    except PageNotAnInteger:
        app_page_obj = author_approving_paginator.get_page(1)
    except EmptyPage:
        app_page_obj = author_approving_paginator.page(author_approving_paginator.num_pages)

    is_app_paginated = True if author_approving_paginator.num_pages >= 1 else False
    approving_page_range = author_approving_paginator.get_elided_page_range(page_app, on_each_side=3, on_ends=2)
    cat_menu = Category.objects.all()
    context = {'author': author,
               'cat_menu': cat_menu,
               'author_published': author_published,
               'author_submitted': author_submitted,
               'draft_page_obj': draft_page_obj,
               'is_draft_page_paginated': is_draft_paginated,
               'draft_page_range': draft_page_range,
               'author_draft_paginator': author_draft_paginator,
               'pub_page_obj': pub_page_obj,
               'is_pub_paginated': is_pub_paginated,
               'published_page_range': published_page_range,
               'author_published_paginator': author_published_paginator,
               'app_page_obj': app_page_obj,
               'is_app_paginated': is_app_paginated,
               'approving_page_range': approving_page_range,
               'author_approving_paginator': author_approving_paginator,
               'current': timezone.now(),
               'role': role,
               }
    return render(request, 'author_posts.html',
                  context=context)


def source_posts_view(request, source):
    source_posts = Post.objects.filter(source=source, status=2)
    cnt = 0
    amounts = len(source_posts)
    for i in source_posts:
        cnt += i.views
    return render(request, 'source_posts.html',
                  {'source_posts': source_posts, 'source': source, 'amounts': amounts, 'cnt': cnt})


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
        current_post = get_object_or_404(Post, id=self.kwargs['pk'])
        likes = current_post.total_liks()
        context["cat_menu"] = cat_menu
        context['role'] = get_user_role(self.request.user)
        context['total_likes'] = likes
        return context

    def get_object(self, queryset=None):
        obj = super().get_object(queryset=queryset)
        obj.increase_views()
        return obj


class AddPostView(LoginRequiredMixin, CreateView):
    login_url = '/members/login_to/'
    model = Post
    form_class = PostForm
    template_name = 'add_post.html'

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        publishers = [p.user_id for p in Profile.objects.filter(is_publisher=True)]

        context = super(AddPostView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        context['publishers'] = publishers
        context['role'] = get_user_role(self.request.user)
        return context

    def form_valid(self, form):
        self.object = form.save()
        if self.object.is_submit:
            self.object.submit()
        # 每个发布者只有一个组
        try:

            self.object.source = self.request.user.groups.all()[0].name
        except IndexError:
            # use default
            logging.warning("bad happends this user doe snot have a team")

        self.object.save()

        return HttpResponseRedirect(self.get_success_url())


@login_required
def bulk_submit(request):
    if request.method == 'POST':
        checked_list = json.loads(request.POST.get('checked_list'))
        if not len(checked_list) > 0:
            return JsonResponse({})
        bulk_action = json.loads(request.POST.get('bulk_action'))
        print(bulk_action)

        # 1. return to draft
        # 2. bulk_submit
        # 3. bulk_delete
        _action = Post.objects.filter(pk__in=checked_list)
        if bulk_action == 'return_to_draft':
            print(_action)
            for obj in _action:
                obj.flush_post()
        elif bulk_action == 'bulk_submit':
            print(_action)
            for obj in _action:
                obj.submit()
        elif bulk_action == 'bulk_delete':  # bulk_delete
            print(_action)
            for obj in _action:
                obj.delete()
        elif bulk_action == 'bulk_approve':
            user = request.user
            lv = get_role_lv(request)
            for obj in _action:
                obj.approval_positive(lv, user.pk)
        elif bulk_action == 'bulk_deny':
            user = request.user
            lv = get_role_lv(request)
            print(lv)
            for obj in _action:
                obj.approval_deny(lv, user.pk)
        return JsonResponse({})
    else:
        pass
    return render(request, 'home_old.html')


class UpdatePostView(LoginRequiredMixin, UpdateView):
    model = Post
    form_class = EditForm
    template_name = 'update_post.html'

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        context = super(UpdatePostView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        context['role'] = get_user_role(self.request.user)
        return context


class DeletePostView(LoginRequiredMixin, DeleteView):
    model = Post
    template_name = 'delete_post.html'
    success_url = reverse_lazy('home')

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        context = super(DeletePostView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        context['role'] = get_user_role(self.request.user)
        return context


class AddCategoryView(CreateView):
    model = Category
    template_name = 'add_post.html'

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        context = super(AddCategoryView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        return context


@login_required
def like_view(request, pk):
    post = get_object_or_404(Post, id=request.POST.get('post_id'))
    post.likes.add(request.user)
    return HttpResponseRedirect(reverse('article_detail', args=[str(pk)]))
