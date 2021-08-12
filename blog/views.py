from django.shortcuts import render
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from .models import Post, Category, Source, Profile
from .forms import PostForm, EditForm
from django.urls import reverse_lazy
from django.contrib.auth.models import User
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

    """
    model = Post
    template_name = 'approval_detail.html'

    def get_context_data(self, *, object_list=None, **kwargs):
        pass



def category_view(request, cats):
    # query categories from db
    category_posts = Post.objects.filter(category=cats)
    cat_menu = Category.objects.all()
    return render(request, 'categories.html', {'cats': cats, 'category_posts': category_posts, 'cat_menu': cat_menu})


def author_posts_view(request, author):
    # 基于上传者统计
    author_posts = Post.objects.filter(author__username=author)
    print(author)
    author = User.objects.get(username=author)
    print(author)
    return render(request, 'author_posts.html', {'author_posts': author_posts, 'author': author})


def source_posts_view(request, source):
    source_posts = Post.objects.filter(source=source)
    cnt = 0
    for i in source_posts:
        cnt += i.views
    return render(request, 'source_posts.html', {'source_posts': source_posts, 'source': source, 'cnt': cnt})


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


def approval(request, *args, **kwargs):
    return render(request, 'approval_detail.html')


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
