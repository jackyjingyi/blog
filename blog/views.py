import datetime
import json
import logging
import os
from datetime import datetime
from collections import defaultdict

from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User, Group, AnonymousUser
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q, Max
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render, get_object_or_404, Http404
from django.urls import reverse_lazy, reverse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django_blog.settings import MEDIA_ROOT
from django.db.models.functions import TruncMonth
from django.db.models import Count
from django.views.decorators.csrf import csrf_exempt
from .serializers import PostSerializer, PostEndProcessSerializer
from rest_framework import generics
from django.db.models.query import QuerySet
from .forms import EditForm, PostFormV2
from .models import Post, Category, Source, Profile, Subcategory

GROUP_NAME = ['大数据重点实验中心', '产品管理', '主题公园&新场景', '康旅度假', '文化&品牌', '新商业', '新型城镇化', '统筹管理', '综合管理', '联盟管理', '华东分院'
              ]
MONTH = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'
         ]

GROUP_LIST = [Group.objects.get(name=i) for i in GROUP_NAME]


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
        elif profile.is_lv4_approver:
            lv = 4
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
        res = {i.name: Post.objects.filter(category=i.name, publish=True).order_by('-publish_date')[:5] for i in
               cat_menu if
               Post.objects.filter(category=i.name, publish=True)}
        post_group = []
        for idx, val in enumerate(res.items()):

            if idx % 2 == 0:
                tmp = val
            else:
                post_group.append((tmp[0], tmp[1], val[0], val[1]))
                tmp = None
        if tmp:
            post_group.append((tmp[0], tmp[1]))
        context = super(HomeView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        context["source_menu"] = source_menu
        context["post_group"] = post_group
        context['role'] = get_user_role(self.request.user)
        # context['hot_article'] = hot_article
        context['group'] = GROUP_LIST

        return context


class ApprovalPosts(LoginRequiredMixin, ListView):
    """
      基于Approver自身的审批等级进行筛选
        1. 本view对post进行简单展示，并非审批功能view
    """
    login_url = '/members/login_to/'
    # redirect_field_name = 'redirect_to'
    model = Post
    template_name = 'approval_list.html'

    def get_queryset(self):
        """
        1. 判断用户角色为审批人, 返回由他负责审批的post
        """
        if not self.request.user.is_staff:
            profile_role = Profile.objects.get(user=self.request.user)
            group = self.request.user.groups.all()
            if profile_role.is_lv1_approver:
                return Post.objects.filter(lv1_approval_status='1', author__groups__in=group).order_by('-submit_time')
            elif profile_role.is_lv2_approver:
                return Post.objects.filter(lv2_approval_status='1', author__groups__in=group).order_by('-submit_time')
            elif profile_role.is_lv3_approver:
                return Post.objects.filter(lv3_approval_status='1', author__groups__in=group).order_by('-submit_time')
            elif profile_role.is_lv4_approver:
                return Post.objects.filter(lv4_approval_status='1', author__groups__in=group).order_by('-submit_time')

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
            Q(lv1_approver=user_id) | Q(lv2_approver=user_id) | Q(lv3_approver=user_id) | Q(
                lv4_approver=user_id)).order_by('-publish_date')
        context = super(ApprovalPosts, self).get_context_data(*args, **kwargs)
        context['approved_list_by_user'] = approved_list_by_user
        context['current'] = timezone.now()
        context['role'] = get_user_role(self.request.user)
        context["cat_menu"] = cat_menu
        context['group'] = GROUP_LIST
        return context


def search_item(request):
    if request.method == "POST":
        # todo: 1. 无body内容会有None type问题
        searched = request.POST.get('searched').strip().lower()

        obj_list = set()
        target = Post.objects.filter(publish=True)
        # print([i.pk for i in target])
        for obj in target:
            # print("testing target {} with {}-{}".format(searched, obj.pk, obj.title))
            try:
                if searched in str(obj.title).lower():
                    # print("find target {} with {}-{}".format(searched, obj.pk, obj.title))
                    obj_list.add(obj.pk)
                elif searched in str(obj.body).lower():
                    # print("find target {} with {}-{}".format(searched, obj.pk, obj.title))
                    obj_list.add(obj.pk)
            except Exception as e:
                logging.info(e)
                continue

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
            elif profile.is_lv4_approver:
                obj.approval_positive(4, user.pk)
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
        context[
            'timer_modal'] = "<div class='modal' tabindex='-1'>" + "<div class='modal-dialog'>" + "<div class='modal-content'>" + \
                             "<div class='modal-header'>" + \
                             "<h5 class='modal-title'>Modal title</h5>" + \
                             "<button type='button' class='btn-close' data-bs-dismiss='modal' aria-label='Close'></button></div>" + \
                             "</div><div class='modal-body'><p>Modal body text goes here.</p></div><div class='modal-footer'>" + \
                             "<button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Close</button>" + \
                             "<button type='button' class='btn btn-primary'>Save changes</button></div></div></div></div>"
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
            elif profile.is_lv4_approver:
                obj.approval_deny(4, user.pk)
            else:
                raise ValueError
        else:
            # TODO:check current post status
            obj.approval_deny(1)
        return obj


def category_view(request, *args, **kwargs):
    # query categories from db
    cats = kwargs['cats']
    category_posts = Post.objects.filter(category=cats, publish=True)
    cat_menu = Category.objects.all()
    context = {'cats': cats, 'category_posts': category_posts, 'cat_menu': cat_menu,
               'role': get_user_role(request.user),
               'group': GROUP_LIST,
               }
    return render(request, 'categories.html', context=context)


@login_required(login_url='/members/login_to/')
def author_posts_view(request, author):
    # 基于上传者统计
    # author_posts = Post.objects.filter(author__username=author)

    author = User.objects.get(id=author)
    # 草稿
    author_draft = Post.objects.filter(author=author, status=1).order_by('-post_date')
    author_published = Post.objects.filter(author=author, publish=True).order_by('-publish_date')
    author_submitted = Post.objects.filter(author=author, is_submit=1, publish=False).order_by(
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
        group = Group.objects.get(name=group_name)
        all_members = User.objects.filter(groups__in=[group])

        posts_list = Post.objects.filter(author__groups__in=[group], publish=True).order_by('-publish_date')
        cat_menu = Category.objects.all()
        res = {i.name: posts_list.filter(category=i.name) for i in cat_menu if
               posts_list.filter(category=i.name)}
        post_group = []
        tmp = None
        for idx, val in enumerate(res.items()):
            if idx % 2 == 0:
                tmp = val
            else:
                post_group.append((tmp[0], tmp[1], val[0], val[1]))
                tmp = None
        if tmp:
            post_group.append((tmp[0], tmp[1]))
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
        posts_list = Post.objects.filter(author__groups__name=group_name, publish=True, author=author).order_by(
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

        z = "<div class='text-muted'>查看：{} 共{}篇</div>".format(author.first_name, posts_list.count())

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
    if request.method == 'GET':
        # 初始化
        context = {
            # 'searched_post': results,
            'group': GROUP_LIST,
            'role': get_user_role(request.user),

        }
        return render(request, 'statics_charts.html', context)


def statics_and_charts_get_data(request):
    if request.method == 'GET':
        # default data
        # { 'dimension' : ['group','total','origin','reproduction'],
        #   'records': [
        #       ['产品管理', 20, 10, 10],
        #   ],
        # }
        _groups = []
        for i in GROUP_NAME:
            _filter_base = Post.objects.filter(author__groups__name__in=[i], publish=True)
            _name, _nums, _origin, _reproduction = i, _filter_base.count(), _filter_base.filter(
                origin='1').count(), _filter_base.filter(origin='2').count()
            _groups.append([_name, _origin, _reproduction, _nums])
        _subcategories = []
        _categories = []
        _filter_base_category = Post.objects.filter(publish=True)
        for i in Category.objects.all():
            _category2, _total2, _origin2, _reproduction2, = i.name, _filter_base_category.filter(
                category=i.name).count(), _filter_base_category.filter(category=i.name,
                                                                       origin='1').count(), _filter_base_category.filter(
                category=i.name, origin='2').count()
            _categories.append([_category2, _origin2, _reproduction2, _total2])
        for i in Subcategory.objects.all():
            _category, _subcategory, _total, _corigin, _creproduction = i.category.name, i.name, _filter_base_category.filter(
                subcategory=i.name, category=i.category.name).count(), _filter_base_category.filter(subcategory=i.name,
                                                                                                    category=i.category.name,
                                                                                                    origin='1').count(), _filter_base_category.filter(
                subcategory=i.name, origin='2', category=i.category.name).count()
            _subcategories.append([_category, _subcategory, _corigin, _creproduction, _total])

        default_data = {
            'dataset0': {
                'dimension': ['group', 'origin', 'reproduction', 'total'],
                'records': _groups,
                'thead': ['#', '组名', '原创', '转载', '总数'],
                'title': '各组文章统计表',
                'tfoot': ['#', '总数', sum([i[1] for i in _groups]), sum([i[2] for i in _groups]),
                          sum([i[3] for i in _groups])],
            },
            'dataset1': {
                'dimension': ['category', 'origin', 'reproduction', 'total'],
                'records': _categories,
                'legend': [i.name for i in Category.objects.all()],
                'thead': ['#', '分类', '原创', '转载', '总数'],
                'title': '一级分类文章统计表',
                'tfoot': ['#', '总数', sum([i[1] for i in _categories]), sum([i[2] for i in _categories]),
                          sum([i[3] for i in _categories])]
            },
            'dataset2': {
                'dimension': ['category', 'subcategory', 'origin', 'reproduction', 'total'],
                'records': _subcategories,
                'thead': ['#', '一级分类', '二级分类', '原创', '转载', '总数'],
                'title': '二级分类文章统计表'
            },
        }

        return JsonResponse(default_data, safe=False)
    elif request.method == 'POST':
        if request.POST.get('group_name'):
            group_name = request.POST.get('group_name')

            requested_group = Group.objects.get(name=group_name)

            all_members = requested_group.user_set.all().filter(profile__is_publisher=True)
            month_data_origin = Post.objects.filter(author__in=all_members, publish=True, origin='1').annotate(
                month=TruncMonth('publish_date')).values('month').annotate(c=Count('id')).values('month', 'c')
            month_data_rep = Post.objects.filter(author__in=all_members, publish=True, origin='2').annotate(
                month=TruncMonth('publish_date')).values('month').annotate(c=Count('id')).values('month', 'c')
            month_set = set()

            _date_origin = defaultdict(int)
            for i in month_data_origin:
                _i_month = i.get('month').strftime('%Y-%m')
                _date_origin[_i_month] = i.get('c')
                month_set.add(_i_month)
            _date_rep = defaultdict(int)
            for i in month_data_rep:
                _i_month = i.get('month').strftime('%Y-%m')
                _date_rep[_i_month] = i.get('c')
                month_set.add(_i_month)
            month_list = sorted(list(month_set))

            _origin_list = ['原创'] + [0] * len(month_list)
            _rep_list = ['转载'] + [0] * len(month_list)
            for idx, val in enumerate(month_list):
                if _date_origin.get(val):
                    _origin_list[idx + 1] = _date_origin.get(val)
                if _date_rep.get(val):
                    _rep_list[idx + 1] = _date_rep.get(val)
            _origin_list += [sum(_origin_list[1:])]
            _rep_list += [sum(_rep_list[1:])]
            group_statics = {
                'dimension': ['dataType'] + month_list + ['总数'],
                'records': [
                    # ['dataType'] + month_list + ['总数'],
                    _origin_list,
                    _rep_list
                ],
                'thead': ['#', '分类'] + month_list + ['总数'],
                'titile': '月度统计表',
                'tfoot': ['#', '总数', ] + [sum([i[j] for i in [_origin_list, _rep_list]])
                                          for j in range(1, len(_origin_list))],

            }

            member_list = []
            for u in all_members:
                member_list.append(
                    {
                        'pk': u.pk,
                        'first_name': u.first_name,
                        'headimg': u.last_name,
                        'published': Post.objects.filter(author=u, publish=True).count(),

                    }
                )

            data = {
                'member_list': member_list,
                'groupStatic': group_statics,
            }

            return JsonResponse(data, status=200)


def source_posts_view(request, source):
    source_posts = Post.objects.filter(source=source, publish=True)
    cnt = 0
    amounts = len(source_posts)
    for i in source_posts:
        cnt += i.views
    return render(request, 'source_posts.html',
                  {'source_posts': source_posts, 'source': source, 'amounts': amounts, 'cnt': cnt, 'group': GROUP_LIST})


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
        context = dict()
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
    login_url = '/members/login_to/'
    success_url = reverse_lazy('home')

    def get_context_data(self, *args, object_list=None, **kwargs):
        cat_menu = Category.objects.all()
        context = super(UpdatePostView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
        context['role'] = get_user_role(self.request.user)
        context['group'] = GROUP_LIST
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


# @login_required(login_url='/members/login_to/')
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
        body = request.body
        print(json.loads(body))
        return JsonResponse({'status': 200}, status=200)


class PostListView(generics.ListCreateAPIView):
    queryset = Post.objects.filter(lv4_approval_status='2', oa_status='0')
    serializer_class = PostSerializer

    def get_queryset(self):
        try:
            other_param = self.request.query_params.dict()
            if "format" in other_param.keys():
                other_param.pop("format")
        except json.decoder.JSONDecodeError:
            other_param = None
        queryset = self.queryset
        if isinstance(queryset, QuerySet):
            if other_param:
                queryset = queryset.filter(**other_param)
            else:
                queryset = queryset.all()
        return queryset


class PostCallBackView(generics.UpdateAPIView):
    queryset = Post.objects.filter(lv4_approval_status='2')
    serializer_class = PostEndProcessSerializer


@login_required(login_url='/members/login_to/')
def approval_article_detail(request, approver, pk):
    if request.method == 'GET':
        approver = User.objects.get(pk=approver)
        role = get_user_role(request.user)
        if role != '2':
            # not approver
            return render(request, 'errors/Error404.html',
                          {'group': GROUP_LIST, 'msg': '非审批者权限', 'role': role})
        try:
            current_post = get_object_or_404(Post, id=pk)
            # raise 404 if post is published in inner approval process
            # tour => 404
            # lv 1-3 with published article => 404
            # publisher with published article => 404
            if current_post.publish and get_role_lv(request) != 4:
                # TODO 错误类型汇总
                msg = '已发布，内部审批已完成，待副院长审批'
                raise Http404
            if not current_post.publish and current_post.lv1_approval_status != '1':
                msg = '已审批'
                raise Http404
        except Http404:
            return render(request, 'errors/Error404.html',
                          {'group': GROUP_LIST, 'msg': msg, 'role': role})
        # user need to be authorised
        if request.user == approver and request.user in current_post.author.groups.first().user_set.all():
            context = dict()
            context['role'] = get_user_role(request.user)
            context['group'] = GROUP_LIST
            context['post'] = current_post
            return render(request, 'approval_article_detail.html', context)
        else:
            return render(request, 'errors/Error404.html',
                          {'group': GROUP_LIST, 'msg': '非授权用户', 'role': role})
    else:
        return bulk_submit(request)


def get_approval_list(request):
    user = request.user
    try:
        if isinstance(user, AnonymousUser):
            raise Http404
        role = Profile.objects.get(user=user)
        if role.role != '2':
            raise Http404
        group = user.groups.all()
        if role.is_lv1_approver:
            return Post.objects.filter(lv1_approval_status='1', author__groups__in=group).order_by('-submit_time')
        elif role.is_lv2_approver:
            return Post.objects.filter(lv2_approval_status='1', author__groups__in=group).order_by('-submit_time')
        elif role.is_lv3_approver:
            return Post.objects.filter(lv3_approval_status='1', author__groups__in=group).order_by('-submit_time')
        elif role.is_lv4_approver:
            return Post.objects.filter(lv4_approval_status='1', author__groups__in=group).order_by('-submit_time')
    except Http404:
        return None


def tag_formatter(tag):
    def add_tags(element, *args, **kwargs):
        tag_properties = ''
        for k, v in kwargs.items():
            if k == 'cls_property':
                tag_properties += f"class = '{v}'"
            else:
                tag_properties += f"{k} = '{v}'"
        return f"<{tag} {tag_properties}>{element}</{tag}>"

    return add_tags


def my_tasks(request):
    headers = ['标题', '作者', '提交日期']
    obj_list = get_approval_list(request)

    if isinstance(request.user, AnonymousUser):
        return JsonResponse({'msg': 'unauthorised user'}, status=401, safe=False)
    else:
        if obj_list:
            link = tag_formatter('a')
            small = tag_formatter('small')
            table = tag_formatter('table')
            thead = tag_formatter('thead')
            tbody = tag_formatter('tbody')
            th = tag_formatter('th')
            tr = tag_formatter('tr')
            td = tag_formatter('td')
            div = tag_formatter('div')
            pre = tag_formatter('pre')
            t_rows = []
            for item in obj_list:
                row = ''
                row += td(
                    small(link(item.title[:15], href='approval_article_detail/{}/{}'.format(request.user.id, item.id))),
                    cls_property='m-1 p-1')
                row += td(small(item.author.first_name), cls_property='m-1 p-1')
                row += td(small(item.update_time.strftime('%Y-%m-%d')), cls_property='m-1 p-1')
                t_rows.append(tr(row, cls_property='m-0'))
            t_body = tbody(''.join(t_rows))
            hrow = ''
            for i in headers:
                hrow += th(small(i), scope='col', cls_property='m-1 p-1')
            t_head = thead(tr(hrow))

            html = div(table(t_head + t_body, cls_property='table table-striped table-bordered m-3 mt-2'),
                       style='width:750px;height:360px;', cls_property='m-1')

            return JsonResponse(html, status=200, safe=False)
        else:
            return JsonResponse({'msg': 'no task'}, status=404, safe=False)
