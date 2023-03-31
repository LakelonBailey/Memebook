from django.urls import path, include
from .views import index, login, signup, upload_meme, get_profile_data
from django.conf import settings
from django.conf.urls.static import static
from main.api_views import Comments

urlpatterns = [
    path('', index, name='index'),
    path('login/', login, name='login'),
    path('signup/', signup, name='signup'),
    path('upload-meme/', upload_meme, name='upload_meme'),
    path('profile-data/', get_profile_data, name='get_profile_data'),
    path('comments/', Comments.as_view(), name='comments'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
