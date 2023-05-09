from django.urls import path, include
from .views import *
from django.conf import settings
from django.conf.urls.static import static
from main.class_views import Comments, Likes, Memes

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
    path('update-profile/', update_profile, name='update_profile'),
    path('decide-friendship/', friend_request_action, name='friend_request_action'),
    path('request-friendship/', request_friend, name='request_friend'),
    path('cancel-friend-request/', cancel_friend_request, name='cancel_friend_request'),
    path('remove-friend/', remove_friend, name='remove_friend'),
    path('profiles/', profile_search, name='profile_search'),
    path('friendship-status/<str:profile_uuid>/', get_friendship_status, name='get_friendship_status'),
    path('friends/', friend_search, name='friend_search'),
    path('messages/<str:friend_uuid>/', get_messages, name='get_messages'),
    path('profile-friends', profile_friend_search, name='profile_friend_search'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
