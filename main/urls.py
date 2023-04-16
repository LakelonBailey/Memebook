from django.urls import path, include
from .views import index, login, signup, upload_meme, get_profile_data, logout
from django.conf import settings
from django.conf.urls.static import static
from main.api_views import Comments, Likes, Memes

urlpatterns = [
    path('', index, name='index'),
    path('login/', login, name='login'),
    path('logout/', logout, name='logout'),
    path('signup/', signup, name='signup'),
    path('upload-meme/', upload_meme, name='upload_meme'),
    path('profile-data/', get_profile_data, name='get_profile_data'),
    path('comments/', Comments.as_view(), name='comments'),
    path('likes/', Likes.as_view(), name='likes'),
    path('memes/', Memes.as_view(), name='memes'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
