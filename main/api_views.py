from django.views import View
from django.http import Http404, JsonResponse, HttpResponse
import json
from main.models import Comment
from django.utils.decorators import method_decorator
from lib.decorators import attach_profile


class Comments(View):

    @method_decorator(attach_profile)
    def post(self, request, profile):
        data = json.loads(request.body)

        Comment.objects.create(
            profile=profile,
            meme_id=data['meme_uuid'],
            text=data['comment_text']
        )

        return HttpResponse()