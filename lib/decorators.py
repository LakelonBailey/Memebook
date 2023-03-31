# Imports
from main.models import Profile

def attach_profile(f):
        def wrap(request, *args, **kwargs):
                user = request.user
                profile, created = Profile.objects.get_or_create(user=user)
                if created:
                        profile.first_name = user.first_name
                        profile.last_name = user.last_name
                        profile.save()
                return f(request, profile, *args, **kwargs)
        wrap.__doc__ = f.__doc__
        wrap.__name__ = f.__name__
        return wrap