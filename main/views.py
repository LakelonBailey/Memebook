from django.shortcuts import render, redirect
from django.http import JsonResponse, Http404, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required
from django.core.files import File
from django.views.decorators.http import require_POST, require_GET
import json
from memebook import settings
from main.models import Meme, DefaultTemplate, Profile
from lib.memes import create_meme
from lib.decorators import attach_profile
from django.db import models

@login_required
@attach_profile
def index(request, profile: Profile):
    context = {
        'logged_in': request.user.is_authenticated,
        'profile': profile.dict()
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


@require_POST
@attach_profile
def upload_meme(request, profile):
    response_data = {}
    data = json.loads(request.body)
    top_text = data['top_text']
    bottom_text = data['bottom_text']
    template_slug = data['template_slug']
    meme_image = create_meme(template_slug, top_text, bottom_text)

    # Create a new Meme instance
    new_meme = Meme(
        top_text=top_text,
        bottom_text=bottom_text,
        template=DefaultTemplate.objects.filter(
            slug_name=template_slug
        ).first(),
        profile=profile
    )

    # Save the meme image using the save() method of the FileField
    new_meme.image.save(f"{new_meme.uuid}.jpeg", File(meme_image))
    new_meme.save()

    response_data['meme_uuid'] = new_meme.uuid
    return JsonResponse(response_data)


@require_GET
@attach_profile
def get_profile_data(request, profile: Profile):
    response_data = {
        'profile': profile.dict()
    }
    memes = (
        profile.memes
        .all()
        .order_by('-created_at')
        .annotate(
            like_count=models.Count('likes'),
            comment_count=models.Count('comments')
        )
    )
    response_data['memes'] = [
        meme.dict() for meme in memes
    ]
    response_data['friend_count'] = profile.friends.count()

    return JsonResponse(response_data)
