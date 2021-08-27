from django.contrib import admin
from .models import Post, Category, Profile,Source,Subcategory,PostStatus

admin.site.register(Post)
admin.site.register(Category)
admin.site.register(Profile)
admin.site.register(PostStatus)
admin.site.register(Source)
admin.site.register(Subcategory)