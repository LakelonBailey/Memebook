# Imports
from main.models import Profile
from django.http import HttpResponseForbidden

def attach_profile(f):
        def wrap(request, *args, **kwargs):
                user = request.user
                if not request.user.is_authenticated:
                        return HttpResponseForbidden()

                profile, created = Profile.objects.get_or_create(user_id=user.id)
                if created:
                        profile.first_name = user.first_name
                        profile.last_name = user.last_name
                        profile.save()
                return f(request, profile, *args, **kwargs)
        wrap.__doc__ = f.__doc__
        wrap.__name__ = f.__name__
        return wrap