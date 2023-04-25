from django.shortcuts import render, redirect
from django.http import JsonResponse, Http404, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST, require_GET
import json
from main.models import *
from lib.memes import create_meme
from lib.decorators import attach_profile
from django.db import models
from django.db.models import Case, When, Value, Q, Subquery, F, CharField, Prefetch, OuterRef, TextField
from django.db.models.functions import Concat
from functools import reduce
from memebook.settings import LOCAL
from operator import or_

@login_required
@attach_profile
def index(request, profile: Profile):
    context = {
        'logged_in': request.user.is_authenticated,
        'profile_json': json.dumps(profile.dict()),
        'LOCAL': LOCAL
    }

    return render(request, 'index.html', context)


def signup(request):
    if request.method == 'GET':
        return render(request, 'signup.html')
    elif request.method == 'POST':
        response_data = {'success': True}
        data = json.loads(request.body)
        user_exists = User.objects.filter(email=data['email']).exists()

        if user_exists:
            response_data['success'] = False
            response_data['reason'] = f"User already exists with email {data['email']}"
            return JsonResponse(response_data)

        password = data.pop('password')
        data['username'] = data['email']
        new_user = User.objects.create(**data)
        new_user.set_password(password)
        new_user.save()
        auth_login(request, new_user)

        return JsonResponse(response_data)


def login(request):
    if request.method == 'GET':
        if request.user.is_authenticated:
            query_dict = dict(request.GET.dict())
            return redirect(query_dict.get('next', '/'))

        return render(request, 'login.html')

    if request.method == 'POST':
        data = json.loads(request.body)
        user = authenticate(
            request,
            username=data['email'],
            password=data['password']
        )
        if user is not None:
            auth_login(request, user)
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'reason': 'Invalid login credentials.'})

def logout(request):
    if request.user.is_authenticated:
        auth_logout(request)

    return redirect('/login/')


@require_POST
@attach_profile
def upload_meme(request, profile):
    response_data = {}
    data = json.loads(request.body)
    new_meme = create_meme(profile, data)
    response_data['meme_uuid'] = new_meme.uuid
    return JsonResponse(response_data)


@require_GET
@attach_profile
def get_profile_data(request, profile: Profile):
    initial_profile = profile
    query_dict = request.GET.dict()

    profile.is_current_user = True
    if 'profile_uuid' in query_dict:
        profile = Profile.objects.filter(
            uuid=query_dict['profile_uuid']
        ).prefetch_related('memes').first()
        if profile is None:
            return Http404()
        profile.is_current_user = (profile == initial_profile)

    if not profile.is_current_user:
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

    profile.friend_count = profile.friends.count()
    profile.meme_count = profile.memes.count()
    profile.like_count = Like.objects.filter(
        meme__profile=profile
    ).count()

    response_data = {
        'profile': profile.dict(),
    }

    return JsonResponse(response_data)


@require_POST
@attach_profile
def update_profile(request, profile: Profile):
    for key, val in json.loads(request.body).items():
        setattr(profile, key, val)
    profile.save()
    return HttpResponse()


@require_POST
@attach_profile
def request_friend(request, profile: Profile):
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
    data = json.loads(request.body)
    FriendRequest.objects.filter(
        requestee_id=data['requestee_uuid'],
        requester=profile
    ).delete()

    return HttpResponse()


@require_POST
@attach_profile
def friend_request_action(request, profile: Profile):
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
    if profile is None:
        return Http404()

    return JsonResponse(profile.dict())



@require_GET
@attach_profile
def profile_search(request, profile: Profile):
    response_data = {}
    query_dict = dict(request.GET.dict())

    search_input = query_dict.pop('search_input', None)
    search_fields = ['first_name', 'last_name', 'user__username']
    search_filters = []
    if search_input:
        terms = [term.strip() for term in search_input.split(' ') if term]
        queries = [models.Q(**{f'{field}__icontains': t}) for t in terms for field in search_fields]
        search_filters.append(reduce(or_, queries))

    profiles = (
        Profile.objects
        .filter(
            *search_filters,
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
    query_dict = request.GET.dict()
    search_input = query_dict.pop('search_input', None)
    search_fields = ['first_name', 'last_name', 'user__username']
    search_filters = []

    if search_input:
        terms = [term.strip() for term in search_input.split(' ') if term]
        queries = [models.Q(**{f'{field}__icontains': t}) for t in terms for field in search_fields]
        search_filters.append(reduce(or_, queries))

    # Subquery for the most recent message sent to profile
    recent_message_subquery = Message.objects.filter(
        Q(sender=OuterRef('pk'), recipient=profile)
        | Q(sender=profile, recipient=OuterRef('pk'))
    ).order_by('-created_at').values('text')[:1]

    friends = (
        profile.friends
        .filter(
            *search_filters
        )
        .order_by(
            'first_name',
            'last_name'
        )
        .annotate(
            recent_message=Subquery(recent_message_subquery, output_field=TextField()),
        )
    )

    return JsonResponse({
        'friends': [friend.dict(
            'uuid',
            'first_name',
            'last_name',
            'recent_message'
        ) for friend in friends]
    })


@require_GET
@attach_profile
def get_messages(request, profile, friend_uuid):
    messages = Message.objects.filter(
        Q(recipient=profile, sender_id=friend_uuid)
        | Q(recipient_id=friend_uuid, sender=profile)
    ).order_by('created_at')

    serialized_messages = []
    for message in messages:
        message.is_user = message.sender == profile
        serialized_messages.append(
            message.dict()
        )

    return JsonResponse({
        'messages': serialized_messages
    })
