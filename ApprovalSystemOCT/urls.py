from django.urls import path
from django.conf.urls import url
from django.conf.urls.static import static
from django.conf import settings
from rest_framework.urlpatterns import format_suffix_patterns
from .views import home_view, BookList, BookDetail

urlpatterns = [
                  path('', home_view, name='home'),
                  url(r'^books/$', BookList.as_view()),
                  url(r'^books/(?P<pk>[0-9]+)/$', BookDetail.as_view()),
              ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns = format_suffix_patterns(urlpatterns)
