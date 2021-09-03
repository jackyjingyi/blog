import datetime
import json
import logging
import os
from collections import defaultdict

from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User, Group, AnonymousUser
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q, Max
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render, get_object_or_404
from django.urls import reverse_lazy, reverse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView

from django_blog.settings import MEDIA_ROOT
from .forms import EditForm, PostFormV2
from .models import Post, Category, Source, Profile, Subcategory

GROUP_LIST = [Group.objects.get(name=i) for i in
              ['旅游大数据', '产品管理', '主体公园&新场景', '康旅度假', '文化&品牌', '新商业', '新型城镇化', '华东分院', '统筹管理', '综合管理', '联盟管理'
               ]]


def get_absolute_upload_path():
    _datetime = datetime.date.today()

    return os.path.join(MEDIA_ROOT, 'uploadPosts/{}/{}/'.format(_datetime.year, _datetime.month))


def is_ext_valid(obj, ext_list=None):
    if not ext_list:
        ext_list = ['pdf']
    ext = obj.name.split('.')[-1].lower()
    if ext not in ext_list:
        return False
    else:
        return True


def handle_uploaded_file(f, path):
    with open(path, 'wb+') as destination:
        for chunk in f.chunks():
            destination.write(chunk)


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
        hot_article = Post.objects.filter(likes=likes_rating).first()
        top_two_topics = sorted(post_group.items(), key=lambda x: x[1].count(), reverse=True)
        context = super(HomeView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        context["source_menu"] = source_menu
        context["post_group"] = post_group
        context['role'] = get_user_role(self.request.user)
        context['hot_article'] = hot_article
        context['top_two_topics'] = top_two_topics
        context['group'] = GROUP_LIST
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
            group = self.request.user.groups.all()[0]
            if profile_role.is_lv1_approver:
                return Post.objects.filter(lv1_approval_status='1', author__groups=group)
            elif profile_role.is_lv2_approver:
                return Post.objects.filter(lv2_approval_status='1', )
            elif profile_role.is_lv3_approver:
                return Post.objects.filter(lv3_approval_status='1', )

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
        searched = request.POST.get('searched')
        obj_list = []
        target = Post.objects.filter(status=2)
        try:
            for obj in target:
                if searched in obj.body or searched in obj.title:
                    obj_list.append(obj.pk)
        except TypeError:
            logging.info("current published article amount is {}".format(target.count()))
        if obj_list:
            results = Post.objects.filter(id__in=obj_list)
        else:
            results = Post.objects.none()
        context = {
            'searched_post': results,
            'group': GROUP_LIST,
            'role': get_user_role(request.user),
        }
        return render(request, 'search_items.html', context)


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
        # print(obj)
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
    context = {'cats': cats, 'category_posts': category_posts, 'cat_menu': cat_menu,
               'role': get_user_role(request.user)}
    return render(request, 'categories.html', context=context)


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
               'group': GROUP_LIST,
               }
    return render(request, 'author_posts.html',
                  context=context)


def group_posts_view(request, group_name):
    """
    list all posts for certain group members
    method: Get
    """
    if request.method == 'GET':
        all_members = User.objects.filter(groups__name=group_name)
        posts_list = Post.objects.filter(author__groups__name=group_name, status=2).order_by('-publish_date')
        cat_menu = Category.objects.all()
        post_group = {i.name: posts_list.filter(category=i.name) for i in cat_menu if
                      posts_list.filter(category=i.name)}
        role = get_user_role(request.user)
        context = {
            'all_members': all_members,
            'posts_list': posts_list,
            'group': GROUP_LIST,
            'role': role,
            'selected_group': group_name,
            'post_group': post_group,

        }
        return render(request, 'group_statics.html', context=context)


def group_author_posts_view(request, group_name, author_name):
    if request.method == 'GET':

        author = User.objects.get(first_name=author_name)
        all_members = User.objects.filter(groups__name=group_name)
        posts_list = Post.objects.filter(author__groups__name=group_name, status=2, author=author).order_by(
            '-publish_date')
        cat_menu = Category.objects.all()
        post_group = {i.name: posts_list.filter(category=i.name) for i in cat_menu if
                      posts_list.filter(category=i.name)}
        # print(post_group)
        author_posts = defaultdict(list)
        for key, val in post_group.items():
            # print(key, val)
            author_posts[key] = [
                {'title': i.title, 'id': i.id, 'category': i.category, 'subcategory': i.subcategory,
                 'author': i.author.first_name,
                 'publish_date': i.publish_date.strftime('%Y年%m月%d日')} for i in val]
        # print(author_posts)

        # context = {
        #     'author': author_name,
        #     'author_posts': author_posts
        #
        # }
        # print(context)
        z = "<div class='text-muted'>查看：{}</div>".format(author.first_name)

        for key, val in author_posts.items():
            _z = "<h4>【<a href='/category/{}/'>{}</a>】</h4> ".format(key, key)
            _t = '<ul>'
            for i in val:
                _t += "<li>【<a href='#'>{0}</a>】<small><a href='/article/{1}'>{2} </a></small><small>日期: {3}</small>".format(
                    i.get('subcategory'), i.get('id'), i.get('title'), i.get('publish_date'))
            _t += '</ul>'
            z += _z + _t
        return JsonResponse({'html': z}, status=200, safe=False)


def statics_and_charts(request):
    context = {
        # 'searched_post': results,
        'group': GROUP_LIST,
        'role': get_user_role(request.user),
    }

    return render(request, 'statics_charts.html', context)


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
        context['group'] = GROUP_LIST
        return context

    def get_object(self, queryset=None):
        obj = super().get_object(queryset=queryset)
        obj.increase_views()
        return obj


@login_required(login_url='/members/login_to/')
@csrf_exempt
def creat_post(request):
    if request.method == 'POST':
        # assign data as submitted form value, file as submitted PDF file object
        data = request.POST
        user = request.user
        logging.info("Current dealing with {}, for user : {}".format(data, user))
        form = PostFormV2(data, request.FILES)
        if form.is_valid():
            form.save(user=user)
        else:
            return JsonResponse(form.errors, status=500)
        return JsonResponse({'msg': 'success'}, status=200)
    else:
        cat_menu = Category.objects.all()
        context = {}
        context["cat_menu"] = cat_menu
        context['role'] = get_user_role(request.user)
        context['tag_items'] = Post.tags.all()
        context['lv1_cats'] = [i for i in Category.objects.all()]
        context['group'] = GROUP_LIST
        if request.user.groups.all():
            context['user_group'] = request.user.groups.all()[0].name
    return render(request, 'add_post.html', context)


def get_subcategory(request):
    if request.method == 'GET':
        item = request.GET.get('lv1_cat')
        lv2_objs = Subcategory.objects.filter(category__name=item)
        context = [i.name for i in lv2_objs]
        return JsonResponse(context, safe=False)


@login_required
def bulk_submit(request):
    if request.method == 'POST':
        checked_list = json.loads(request.POST.get('checked_list'))
        if not len(checked_list) > 0:
            return JsonResponse({})
        bulk_action = json.loads(request.POST.get('bulk_action'))
        # print(bulk_action)

        # 1. return to draft
        # 2. bulk_submit
        # 3. bulk_delete
        _action = Post.objects.filter(pk__in=checked_list)
        if bulk_action == 'return_to_draft':
            for obj in _action:
                obj.flush_post()
        elif bulk_action == 'bulk_submit':
            for obj in _action:
                obj.submit()
        elif bulk_action == 'bulk_delete':  # bulk_delete
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
            for obj in _action:
                obj.approval_deny(lv, user.pk)
        return JsonResponse({'msg': 'success'}, status=200)
    else:
        # print(request.user)
        # print(request.user.is_authenticated)
        pass
    return render(request, 'home.html')


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


@login_required(login_url='/members/login_to/')
def like_view(request, pk):
    if request.method == 'POST':
        post = get_object_or_404(Post, id=request.POST.get('post_id'))
        post.likes.add(request.user)
        return HttpResponseRedirect(reverse('article_detail', args=[str(pk)]))
    else:
        post = get_object_or_404(Post, id=request.POST.get('post_id'))
    return render(request, 'article_detail.html', {'pk': post.id})


@login_required(login_url='/members/login_to/')
@csrf_exempt
def oct_get_endpoint_view(request, *args, **kwargs):
    """
    login_required 确保了是已登录用户，但是未保证用户是集团方的，目前用userid进行限制
    """
    if request.method == 'GET':
        # 检查
        # if request.user.pk == xx 确认账户
        # TODO: 根据month和round筛选
        month = request.GET.get('month')
        round = request.GET.get('round')
        posts = Post.objects.filter(oa_status='1')
        # data = serializers.serialize("json", posts, fields=('title','post_file','category','body'))
        data = []
        for item in posts:
            data.append(
                {
                    'pk': item.pk,
                    'title': item.title,
                    'category': item.category,
                    'subcategory': item.subcategory,
                    'post_file_name': item.post_file.name,
                    'post_file_url': item.post_file.url,
                    'tags': [i['name'] for i in item.tags.values() if item.tags],
                    'publish_date': item.publish_date,
                    'send_date': timezone.now(),
                }
            )

        results = {'status': 'success',
                   'company': '华侨城创新研究院',
                   'articleAmount': posts.count(),
                   'generateTime': timezone.now(),
                   'month': request.GET.get('month'),
                   'round': request.GET.get('round'),
                   'RECORDS': data
                   }

        return JsonResponse(results, safe=False)
    else:
        info = request.POST
        return JsonResponse({'status': 200}, status=200)
