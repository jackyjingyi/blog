from django.urls import path
from .views import HomeView, ArticleDetailView, AddPostView, UpdatePostView, DeletePostView, AddCategoryView, \
    category_view, author_posts_view, source_posts_view, ApprovalPosts, ApprovalSuccessDetailView, \
    ApprovalDenyDetailView, SubmitPostDetailView, search_item, bulk_submit
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
                  path('', HomeView.as_view(), name='home'),
                  path('article/<int:pk>', ArticleDetailView.as_view(), name='article_detail'),
                  path('add_post/', AddPostView.as_view(), name='add_post'),
                  path('add_category/', AddCategoryView.as_view(), name='add_category'),
                  path('acticle/update/<int:pk>', UpdatePostView.as_view(), name='update_post'),
                  path('acticle/<int:pk>/remove', DeletePostView.as_view(), name='delete_post'),
                  path('category/<str:cats>/', category_view, name='category'),
                  path('author/<str:author>', author_posts_view, name='author_post'),
                  path('source/<str:source>', source_posts_view, name='source_post'),
                  path('approval/<str:username>', ApprovalPosts.as_view(), name='approval_list'),
                  path('approval/<str:username>/<int:pk>/success', ApprovalSuccessDetailView.as_view(),
                       name='approval_success_update'),
                  path('approval/<str:username>/<int:pk>/deny', ApprovalDenyDetailView.as_view(),
                       name="approval_deny_update"),
                  path('submit_post/<int:pk>', SubmitPostDetailView.as_view(), name='submit_post'),
                  path('search_post/results', search_item, name='search_items'),
                  path('bulk_submit/', bulk_submit, name='bulk_submit'),
              ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
