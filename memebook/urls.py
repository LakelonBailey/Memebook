from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from . import settings
from memebook.general_api import GeneralAPI

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('main.urls')),
    path('api/general/<str:model_name>/', GeneralAPI.as_view(), name='general_api'),
]
