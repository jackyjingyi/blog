from django.shortcuts import render
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from .models import Post, Category, Source
from .forms import PostForm, EditForm
from django.urls import reverse_lazy


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


def category_view(request, cats):
    # query categories from db
    category_posts = Post.objects.filter(category=cats)
    cat_menu = Category.objects.all()
    return render(request, 'categories.html', {'cats': cats, 'category_posts': category_posts, 'cat_menu': cat_menu})


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
        context = super(AddPostView, self).get_context_data(*args, **kwargs)
        context["cat_menu"] = cat_menu
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
