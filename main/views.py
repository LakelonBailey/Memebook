from django.shortcuts import render
from django.http import JsonResponse, Http404, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login as auth_login
import json


def index(request):
    context = {}
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