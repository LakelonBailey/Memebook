from django.views import View
from django.http import Http404, JsonResponse, HttpResponse
import json
from main.models import Comment, Like, Meme
from django.utils.decorators import method_decorator
from lib.decorators import attach_profile
from django.db import models
from pprint import pprint


class Comments(View):

    @method_decorator(attach_profile)
    def get(self, request, profile):
        response_data = {
            'comments': []
        }
        comments = Comment.objects.filter(
            **request.GET.dict()
        ).order_by('-created_at')

        for comment in comments:
            comment.belongs_to_user = (
                comment.profile.uuid == profile.uuid
            )
            response_data['comments'].append(comment.dict(
                keep_related=True
            ))

        return JsonResponse(response_data)

    @method_decorator(attach_profile)
    def post(self, request, profile):
        data = json.loads(request.body)

        Comment.objects.create(
            profile=profile,
            meme_id=data['meme_uuid'],
            text=data['comment_text']
        )

        return HttpResponse()

    @method_decorator(attach_profile)
    def delete(self, request, profile):
        data = json.loads(request.body)
        Comment.objects.filter(
            profile=profile,
            uuid=data['comment_uuid']
        ).delete()

        return HttpResponse()


class Likes(View):

    @method_decorator(attach_profile)
    def post(self, request, profile):
        data = json.loads(request.body)

        Like.objects.create(
            profile=profile,
            meme_id=data['meme_uuid']
        )

        return HttpResponse()

    @method_decorator(attach_profile)
    def delete(self, request, profile):
        data = json.loads(request.body)

        Like.objects.filter(
            profile=profile,
            meme_id=data['meme_uuid']
        ).delete()

        return HttpResponse()


class Memes(View):

    @method_decorator(attach_profile)
    def get(self, request, profile):
        response_data = {
            'memes': []
        }

        memes = (
            Meme.objects
            .filter(
                profile__isnull=False
            )
            .prefetch_related('likes', 'comments')
            .select_related('profile')
            .distinct()
        )

        for meme in memes:
            meme.like_count = meme.likes.count()
            meme.comment_count = meme.comments.count()
            meme.liked_by_user = meme.likes.filter(
                profile=profile
            ).exists()

            response_data['memes'].append(meme.dict(
                'profile',
                'like_count',
                'comment_count',
                'liked_by_user',
                'uuid',
                'image',
                keep_related=True
            ))

        response_data['memes'] = sorted(
            response_data['memes'],
            reverse=True,
            key=lambda meme: meme['like_count']
        )

        return JsonResponse(response_data)