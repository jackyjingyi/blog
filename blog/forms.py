from django import forms
from .models import Post, Category

choices = [i for i in Category.objects.all().values_list('name', 'name')]


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ('title', 'title_tag', 'author', 'category', 'body', 'post_file', 'is_submit')
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'title_tag': forms.TextInput(attrs={'class': 'form-control'}),
            'author': forms.TextInput(attrs={'class': 'form-control', 'id': 'pub_id', 'value': '', 'type': 'hidden'}),
            # 'author': forms.Select(attrs={'class': 'form-control'}),
            'category': forms.Select(choices=choices, attrs={'class': 'form-control'}),
            'body': forms.Textarea(attrs={'class': 'form-control'}),
            'is_submit': forms.CheckboxInput(),
            'post_file': forms.FileInput(attrs={'class': 'form-control', }),

        }
        help_texts = {
            'is_submit': ('勾选后直接提交并进入审批流程,不勾选则存为草稿'),
        }


class EditForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ('title', 'title_tag', 'body', 'post_file')
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'title_tag': forms.TextInput(attrs={'class': 'form-control'}),
            'body': forms.Textarea(attrs={'class': 'form-control'}),
            'post_file': forms.FileInput(attrs={'class': 'form-control', }),
        }
