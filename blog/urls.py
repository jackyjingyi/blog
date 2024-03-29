from django.urls import path
from .views import HomeView, ArticleDetailView, UpdatePostView, DeletePostView, AddCategoryView, \
    category_view, author_posts_view, source_posts_view, ApprovalPosts, ApprovalSuccessDetailView, \
    ApprovalDenyDetailView, SubmitPostDetailView, search_item, bulk_submit, like_view, oct_get_endpoint_view, \
    creat_post, get_subcategory, group_posts_view, group_author_posts_view, statics_and_charts, \
    statics_and_charts_get_data, approval_article_detail, my_tasks, PostListView, PostCallBackView
from django.conf.urls.static import static
from django.conf import settings
from django.conf.urls import url, include

urlpatterns = [
                  path('', HomeView.as_view(), name='home'),
                  path('article/<int:pk>', ArticleDetailView.as_view(), name='article_detail'),
                  path('add_post/', creat_post, name='add_post'),
                  path('add_post/get_subcategory/', get_subcategory),
                  path('add_category/', AddCategoryView.as_view(), name='add_category'),
                  path('acticle/update/<int:pk>', UpdatePostView.as_view(), name='update_post'),
                  path('acticle/<int:pk>/remove', DeletePostView.as_view(), name='delete_post'),
                  path('category/<str:cats>/', category_view, name='category'),
                  path('author/<int:author>', author_posts_view, name='author_post'),
                  path('source/<str:source>', source_posts_view, name='source_post'),
                  path('approval/<int:pk>', ApprovalPosts.as_view(), name='approval_list'),
                  path('approval/<int:approver>/<int:pk>/success', ApprovalSuccessDetailView.as_view(),
                       name='approval_success_update'),
                  path('approval/<int:approver>/<int:pk>/deny', ApprovalDenyDetailView.as_view(),
                       name="approval_deny_update"),
                  path('submit_post/<int:pk>', SubmitPostDetailView.as_view(), name='submit_post'),
                  path('search_post/results', search_item, name='search_items'),
                  path('bulk_submit/', bulk_submit, name='bulk_submit'),
                  path('like/<int:pk>', like_view, name='like_post'),
                  path('oct_get_post_list/', oct_get_endpoint_view),
                  path('group_posts/<str:group_name>/', group_posts_view, name='group_post'),
                  path('group_posts/<str:group_name>/<str:author_name>/', group_author_posts_view),
                  path('statics_and_charts/', statics_and_charts, name="statics_and_charts"),
                  path('statics_and_charts_get_data/', statics_and_charts_get_data),
                  path('approval_article_detail/<int:approver>/<int:pk>/', approval_article_detail,
                       name='approval_articel_detail'),
                  path('mytasks/', my_tasks),
                  url(r'^get-iri-posts/$', PostListView.as_view(), name='get-iri-posts'),
                  url(r"^oct-group-callback/(?P<pk>[0-9a-f-]+)/$", PostCallBackView.as_view()),
              ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
