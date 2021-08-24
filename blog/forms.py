from django import forms
from .models import Post, Category
from taggit.forms import TagField
from taggit_labels.widgets import LabelWidget
from django.core.validators import ValidationError

choices = [i for i in Category.objects.all().values_list('name', 'name')]


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ('title', 'author', 'category', 'tags', 'body', 'post_file', 'is_submit')
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'tags': LabelWidget(),
            # 'title_tag': forms.TextInput(attrs={'class': 'form-control'}),
            'author': forms.TextInput(attrs={'class': 'form-control', 'id': 'pub_id', 'value': '', 'type': 'hidden'}),
            # 'author': forms.Select(attrs={'class': 'form-control'}),
            'category': forms.Select(choices=choices, attrs={'class': 'form-control'}),
            'body': forms.Textarea(attrs={'class': 'form-control'}),
            'is_submit': forms.CheckboxInput(),
            'post_file': forms.FileInput(attrs={'class': 'form-control', }),

        }
        help_texts = {
            'is_submit': ('勾选后直接提交并进入审批流程,不勾选则存为草稿'),
            'tags': ('请选择标签，最多选择3个')
        }

    def clean_tags(self):
        data = self.cleaned_data.get('tags', [])
        if len(data) > 3:
            raise ValidationError('最多选择3个标签', code='invalid')
        return data



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
