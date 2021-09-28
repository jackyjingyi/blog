from django import forms
from django.contrib.auth.models import User
from .models import Post, Category
from taggit.forms import TagField
from taggit_labels.widgets import LabelWidget
from django.core.validators import ValidationError

# from crispy_forms.helper import FormHelper, FormHelpersException
# from crispy_forms.layout import Submit

choices = [i for i in Category.objects.all().values_list('name', 'name')]


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ('title', 'category', 'tags', 'body', 'post_file', 'is_submit')
        widgets = {
            'title': forms.TextInput(),
            'tags': LabelWidget(),
            'category': forms.Select(),
            'body': forms.Textarea(),
            'is_submit': forms.CheckboxInput(),
            'post_file': forms.FileInput(),

        }

    def clean_tags(self):
        data = self.cleaned_data.get('tags', [])
        if len(data) > 3:
            raise ValidationError('最多选择3个标签', code='invalid')
        return data

    def clean_post_file(self):
        file = self.cleaned_data['post_file']
        ext = file.name.split('.')[-1].lower()
        if ext not in ['pdf']:
            raise forms.ValidationError("Only 'PDF' files are allowed.")
        return file


class PostFormV2(forms.Form):
    title = forms.CharField(max_length=255)
    category1 = forms.CharField(max_length=255)
    category2 = forms.CharField(max_length=255)
    origin = forms.CharField(max_length=50)
    body = forms.CharField(required=False)
    post_file = forms.FileField(max_length=255)
    is_submit = forms.BooleanField(required=False)

    def clean_tags(self):
        data = self.cleaned_data.get('tags', [])
        if len(data) > 3:
            raise ValidationError('Too many tags! Select At most 3 tags！', code='invalid')
        return data

    def save(self, *args, **kwargs):
        user = kwargs.get('user')
        post = Post()
        post.title = self.cleaned_data.get('title')
        post.author = user
        post.category = self.cleaned_data.get('category1')
        post.subcategory = self.cleaned_data.get('category2')
        if self.cleaned_data.get('is_submit'):
            post.submit()
        post.body = self.cleaned_data.get('body')
        post.is_submit = self.cleaned_data.get('is_submit')
        post.origin = self.cleaned_data.get('origin')
        post.post_file.save(self.cleaned_data.get('post_file').name, self.cleaned_data.get('post_file'))
        post.save()


class EditForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ('title', 'body', 'post_file', 'category', 'subcategory', 'origin')
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'body': forms.Textarea(attrs={'class': 'form-control'}),
            'post_file': forms.FileInput(attrs={'class': 'form-control', }),
            'category': forms.Select(choices=choices, attrs={'class': 'form-control'}),
            'subcategory': forms.Select(attrs={'class': 'form-control'}),
            'origin': forms.Select(attrs={'class': 'form-control'})
        }
