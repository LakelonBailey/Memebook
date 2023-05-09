from django.shortcuts import render, redirect
from django.http import JsonResponse, Http404, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST, require_GET
import json
from main.models import *
from lib.memes import create_meme
from lib.utils import distinct_models
from lib.decorators import attach_profile
from django.db import models
from django.db.models import Case, When, Value, Q, Subquery, F, CharField, Prefetch, OuterRef, TextField, Count
from django.db.models.functions import Concat
from functools import reduce
from memebook.settings import LOCAL
from operator import or_
from lib.utils import dynamic_filter

@login_required
@attach_profile
def index(request, profile: Profile):

    # Set first and last name from user if unset
    if profile.first_name is None or profile.last_name is None:
        profile.first_name = profile.user.first_name
        profile.last_name = profile.user.last_name
        profile.save()

    # Gather context
    context = {
        'profile_json': json.dumps(profile.dict()),
        'LOCAL': LOCAL
    }

    # Render application
    return render(request, 'index.html', context)


# Handle signup
def signup(request):

    # Render signup page
    if request.method == 'GET':
        return render(request, 'signup.html')

    # Handle signup attempt
    elif request.method == 'POST':
        response_data = {'success': True}
        data = json.loads(request.body)
        user_exists = User.objects.filter(email=data['email']).exists()

        # Repeated username
        if user_exists:
            response_data['success'] = False
            response_data['reason'] = f"User already exists with email {data['email']}"
            return JsonResponse(response_data)

        # Create and log in user
        password = data.pop('password')
        data['username'] = data['email']
        new_user = User.objects.create(**data)
        new_user.set_password(password)
        new_user.save()
        auth_login(request, new_user)

        return JsonResponse(response_data)


def login(request):
    if request.method == 'GET':

        # Render login page if not authenticated, otherwise render application
        if request.user.is_authenticated:
            query_dict = dict(request.GET.dict())
            return redirect(query_dict.get('next', '/'))

        return render(request, 'login.html')

    if request.method == 'POST':

        # Handle login attempt
        data = json.loads(request.body)
        user = authenticate(
            request,
            username=data['email'],
            password=data['password']
        )

        # User is found
        if user is not None:
            auth_login(request, user)
            return JsonResponse({'success': True})

        # Bad credentials
        else:
            return JsonResponse({'success': False, 'reason': 'Invalid login credentials.'})


def logout(request):

    # Clear user from session and redirect to login
    if request.user.is_authenticated:
        auth_logout(request)

    return redirect('/login/')


@require_POST
@attach_profile
def upload_meme(request, profile):

    # Handle meme upload
    response_data = {}
    data = json.loads(request.body)
    new_meme = create_meme(profile, data)
    response_data['meme_uuid'] = new_meme.uuid
    return JsonResponse(response_data)


@require_GET
@attach_profile
def get_profile_data(request, profile: Profile):

    # Get all necessary data to render a profile
    initial_profile = profile
    query_dict = request.GET.dict()

    profile.is_current_user = True

    # Get a specific profile, not the user's profile
    if 'profile_uuid' in query_dict:
        profile = Profile.objects.filter(
            uuid=query_dict['profile_uuid']
        ).prefetch_related('memes').first()
        if profile is None:
            return Http404()
        profile.is_current_user = (profile == initial_profile)

    if not profile.is_current_user:

        # Determine friendship status

        profile.is_friend = profile.friends.filter(
            uuid=initial_profile.uuid
        ).exists()

        if not profile.is_friend:
            profile.requested_user_friendship = profile.sent_requests.filter(
                requestee=initial_profile
            ).exists()

            profile.user_requested_friendship = profile.received_requests.filter(
                requester=initial_profile
            ).exists()

    # Gather profile stats
    profile.friend_count = profile.friends.count()
    profile.meme_count = profile.memes.count()
    profile.like_count = Like.objects.filter(
        meme__profile=profile
    ).count()

    # Serialize and return data
    response_data = {
        'profile': profile.dict(),
    }
    return JsonResponse(response_data)


@require_POST
@attach_profile
def update_profile(request, profile: Profile):

    # Update profile with key/value pairs from posted data
    for key, val in json.loads(request.body).items():
        setattr(profile, key, val)
    profile.save()

    return HttpResponse()


@require_POST
@attach_profile
def request_friend(request, profile: Profile):

    # Create friend request

    data = json.loads(request.body)
    requestee = Profile.objects.filter(
        uuid=data.get('requestee_uuid', None)
    ).first()
    if requestee is None:
        return Http404()

    if not requestee.is_private:
        profile.friends.add(requestee)
    else:
        FriendRequest.objects.create(
            requester=profile,
            requestee=requestee
        )

    return HttpResponse()


@require_POST
@attach_profile
def cancel_friend_request(request, profile: Profile):

    # Cancel friend request

    data = json.loads(request.body)
    FriendRequest.objects.filter(
        requestee_id=data['requestee_uuid'],
        requester=profile
    ).delete()

    return HttpResponse()


@require_POST
@attach_profile
def friend_request_action(request, profile: Profile):

    # Accept or ignore friend request

    data = json.loads(request.body)
    friend_request = FriendRequest.objects.filter(
        requestee=profile,
        requester_id=data['requester_uuid']
    ).first()

    if friend_request is None:
        return Http404()

    action = data['action']
    if action == 'accept':
        friend_request.fullfill()
    elif action == 'ignore':
        friend_request.delete()

    return HttpResponse()


@require_POST
@attach_profile
def remove_friend(request, profile: Profile):

    # Remove friend from profile's friend list
    data = json.loads(request.body)
    friend_uuid = data['friend_uuid']

    friend = Profile.objects.filter(
        uuid=friend_uuid
    ).first()

    if friend is None:
        return Http404()

    profile.friends.remove(friend)

    return HttpResponse()


@require_GET
@attach_profile
def get_friendship_status(request, user_profile, profile_uuid):

    # Get a profile, annotating it with variables that depict the profile's friendship status
    # with the user
    profile = (
        Profile.objects
        .filter(
            uuid=profile_uuid
        )
        .annotate(
            is_friend=Case(
                When(
                    friends__uuid=user_profile.uuid,
                    then=Value(True)
                ),
                default=Value(False)
            ),
            user_requested_friendship=Case(When(received_requests__requester=user_profile, then=Value(True)), default=Value(False)),
            requested_user_friendship=Case(When(sent_requests__requestee=user_profile, then=Value(True)), default=Value(False))
        )
        .first()
    )

    # Bad uuid
    if profile is None:
        return Http404()

    # Return data
    return JsonResponse(profile.dict())



@require_GET
@attach_profile
def profile_search(request, profile: Profile):
    response_data = {}
    query_dict = dict(request.GET.dict())

    search_input = query_dict.pop('search_input', None)
    search_fields = ['first_name', 'last_name', 'user__username']

    profiles = distinct_models(
        Profile.objects
        .filter(
            *dynamic_filter(search_input, search_fields)
        )
        .exclude(
            uuid=profile.uuid
        )
        .annotate(
            is_friend=Case(
                When(
                    friends__uuid=profile.uuid,
                    then=Value(True)
                ),
                default=Value(False)
            ),
            user_requested_friendship=Case(When(received_requests__requester=profile, then=Value(True)), default=Value(False)),
            requested_user_friendship=Case(When(sent_requests__requestee=profile, then=Value(True)), default=Value(False))
        )
        .order_by('first_name', 'last_name')
        .distinct('first_name', 'last_name', 'pk')
    )

    profile_data = []
    for searched_profile in profiles:
        profile_data.append(searched_profile.dict(
            'uuid',
            'first_name',
            'last_name',
            'is_friend',
            'is_private',
            'requested_user_friendship',
            'user_requested_friendship'
        ))


    response_data['profiles'] = profile_data

    return JsonResponse(response_data)



@require_GET
@attach_profile
def friend_search(request, profile: Profile):
    # Retrieve query parameters from the request
    query_dict = request.GET.dict()
    search_input = query_dict.pop('search_input', None)

    # Define the fields to search in for friend objects
    search_fields = ['first_name', 'last_name', 'user__username']

    # Define subqueries to retrieve the most recent message text and time sent between the authenticated user and each friend
    recent_message_text_subquery = Message.objects.filter(
        Q(sender=OuterRef('pk'), recipient=profile)
        | Q(sender=profile, recipient=OuterRef('pk'))
    ).order_by('-created_at').values('text')[:1]

    recent_message_time_subquery = Message.objects.filter(
        Q(sender=OuterRef('pk'), recipient=profile)
        | Q(sender=profile, recipient=OuterRef('pk'))
    ).order_by('-created_at').values('created_at')[:1]

    # Retrieve friends
    friends = distinct_models(
        profile.friends
        .filter(
            *dynamic_filter(search_input, search_fields)
        )
        .annotate(
            recent_message=Subquery(recent_message_text_subquery, output_field=TextField()),
            recent_message_time=Subquery(recent_message_time_subquery, output_field=TextField()),
            num_unread=Count(
                'sent_messages',
                filter=Q(sent_messages__is_read=False, sent_messages__sender=F('uuid'), sent_messages__recipient_id=profile.uuid),
                distinct=True
            )
        )
        .order_by(
            F('recent_message_time').desc(nulls_last=True),
            'first_name',
            'last_name'
        )
    )

    # Serialize data
    response_data = {
        'friends': [friend.dict(
            'uuid',
            'first_name',
            'num_unread',
            'last_name',
            'recent_message'
        ) for friend in friends]
    }

    # Return data
    return JsonResponse(response_data)



@require_GET
@attach_profile
def get_messages(request, profile, friend_uuid):

    # Retrieve all messages between the authenticated user and the specified friend, ordered by creation date
    messages = Message.objects.filter(
        Q(recipient=profile, sender_id=friend_uuid)
        | Q(recipient_id=friend_uuid, sender=profile)
    ).order_by('created_at')

    # Initialize a list to store serialized message objects
    serialized_messages = []
    for message in messages:
        message.is_user = message.sender == profile
        if not (message.is_read or message.is_user):
            message.is_read = True
            message.save()

        # Add serialized message
        serialized_messages.append(message.dict())

    # Return data
    return JsonResponse({
        'messages': serialized_messages
    })



@require_GET
@attach_profile
def profile_friend_search(request, profile):

    # Retrieve query parameters from the request
    query_dict = request.GET.dict()
    search_input = query_dict.pop('search_input', None)

    # Define the fields to search in for friend objects
    search_fields = ['first_name', 'last_name', 'user__username']

    # Retrieve friend objects
    friends = (
        profile.friends
        .filter(
            *dynamic_filter(search_input, search_fields)
        )
        .order_by('first_name', 'last_name')
    )

    friend_data = []
    for friend in friends:
        friend.is_friend = True
        friend_data.append(friend.dict())

    # Serialize
    response_data = {
        'friends': friend_data
    }

    # Return data
    return JsonResponse(response_data)


@require_GET
@attach_profile
def profile_friend_requests(request, profile):
    # Assuming the profile variable is already defined
    friend_requests_received = distinct_models(
        FriendRequest.objects.filter(requestee=profile)
    )

    # To get the requester Profiles
    requester_data = []
    for friend_request in friend_requests_received:
        requester = friend_request.requester
        requester.requested_user_friendship = True

        requester_data.append(requester.dict())

    return JsonResponse({
        'requesters': requester_data
    })


