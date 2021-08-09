from django.urls import path
from .views import HomeView, ArticleDetailView, AddPostView, UpdatePostView, DeletePostView, AddCategoryView, \
    category_view
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
                  path('', HomeView.as_view(), name='home'),
                  path('article/<int:pk>', ArticleDetailView.as_view(), name='article_detail'),
                  path('add_post/', AddPostView.as_view(), name='add_post'),
                  path('add_category/', AddCategoryView.as_view(), name='add_category'),
                  path('acticle/edita/<int:pk>', UpdatePostView.as_view(), name='update_post'),
                  path('acticle/<int:pk>/remove', DeletePostView.as_view(), name='delete_post'),
                  path('category/<str:cats>/', category_view, name='category'),
              ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
