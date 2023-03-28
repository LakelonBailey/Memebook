from django.urls import path, include
from .views import index, login, signup, upload_meme
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', index, name='index'),
    path('login/', login, name='login'),
    path('signup/', signup, name='signup'),
    path('upload-meme/', upload_meme, name='upload_meme'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
