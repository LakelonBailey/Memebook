from django.views import View
from django.http import Http404, JsonResponse, HttpResponse
import json
from main.models import Comment, Like, Meme
from django.utils.decorators import method_decorator
from lib.decorators import attach_profile
from django.db import models
from django.db.models import Count, Case, When, Value, BooleanField, Exists, OuterRef
from pprint import pprint
import math
from lib.sorting import sort_memes


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

        query_dict = request.GET.dict()
        page = int(query_dict.get('page', 1))
        size = int(query_dict.get('size', 9))
        filter_friends = query_dict.get('filter_friends', 'False') == 'True'
        filter_liked = query_dict.get('filter_liked', 'False') == 'True'

        profile_uuid = query_dict.get('profile_uuid', None)
        filters = {}
        secondary_filters = {}

        if filter_friends:
            sorter = "relevance"
            filters['profile__in'] = models.Subquery(
                profile.friends.values_list('uuid', flat=True)
            )
        elif profile_uuid:
            sorter = "recent"
            if filter_liked:
                filters['uuid__in'] = models.Subquery(
                    Like.objects.filter(
                        profile_id=profile_uuid
                    ).values_list('meme__uuid', flat=True)
                )

            else:
                filters['profile_id'] = query_dict['profile_uuid']
        else:
            sorter = "relevance"
            filters['profile__isnull'] = False
            filters['profile__is_private'] = False
            secondary_filters['liked_by_user'] = False

        memes = (
            Meme.objects
            .filter(**filters)
            .annotate(
                like_count=Count('likes', distinct=True),
                comment_count=Count('comments', distinct=True),
                liked_by_user=Exists(
                    Like.objects.filter(profile=profile, meme=OuterRef('uuid'))
                ),
                commented_by_user=Exists(
                    Comment.objects.filter(profile=profile, meme=OuterRef('uuid'))
                ),
            )
            .filter(**secondary_filters)
            .select_related('profile')
        )

        total_results = len(memes)

        # Calculate number of pages
        response_data['last_page'] = math.ceil(total_results / size)

        # Calculate result range
        start = (page - 1) * size
        stop = start + size
        response_data['memes'] = sort_memes(
            memes,
            profile=profile,
            sorter=sorter,
            size=total_results,
            start=start,
            stop=stop
        )

        return JsonResponse(response_data)