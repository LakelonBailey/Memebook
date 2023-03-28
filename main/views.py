from django.shortcuts import render, redirect
from django.http import JsonResponse, Http404, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
import json
from memebook import settings
from main.models import Meme

@login_required
def index(request):
    context = {
        'logged_in': request.user.is_authenticated
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
def upload_meme(request):
    uploaded_file = request.FILES['meme_file']

    # create a new Meme object with the uploaded file
    new_meme = Meme.objects.create(
        image=uploaded_file
    )

    # save the Meme object to the database
    new_meme.save()

    # return a JSON response with the URL of the uploaded file
    response_data = {'url': new_meme.image.url}

    return JsonResponse(response_data)
