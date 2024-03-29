import django_heroku
import environ
import os
import dj_database_url
from pprint import pprint


"""
IGNORE THIS FILE
This code involves environment establishment and server settings
This code does not aid much in understanding the app's functionality apart from libraries used
"""

# Initialise environment variables
env = environ.Env()
env.read_env()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Secret Key
SECRET_KEY = env('SECRET_KEY')

# Turn off LOCAL and DEBUG before pushing to production
LOCAL = env('DJANGO_LOCAL', default='False').lower() == 'true'
DEBUG = env('DJANGO_DEBUG', default='False').lower() == 'true'

USE_POSTGRES_LOCAL = True


ALLOWED_HOSTS = ['ltb-memebook.herokuapp.com', 'localhost', '127.0.0.1']
CSRF_TRUSTED_ORIGINS = ["https://ltb-memebook.herokuapp.com"]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'memebook',
    'main',
    'channels',
    'rest_framework'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'memebook.urls'

###########################################
#######          TEMPLATES          #######
###########################################

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates')
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'debug': DEBUG,
            'context_processors': [

                # Django
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.debug',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
                'django.template.context_processors.request',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]



# Database Configuration
if LOCAL and USE_POSTGRES_LOCAL:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql_psycopg2',
            'NAME': env('LOCAL_DB_NAME', default=''),
            'USER': env('LOCAL_DB_USER', default=''),
            'PASSWORD': env('LOCAL_DB_PASSWORD', default=''),
            'HOST': env('LOCAL_DB_HOST', default=''),
            'PORT': env('LOCAL_DB_PORT', default='')
        }
    }
elif LOCAL:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': f"{BASE_DIR}/db.sqlite3",
        }
    }
else:
    DATABASES = {
        'default': dj_database_url.config(
            conn_max_age=600,
            ssl_require=True
        )
    }

ASGI_APPLICATION = 'memebook.asgi.application'

# Channels layer configuration
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    }
}


# AWS Configuration
AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID', default='')
AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY', default='')
AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME', default='')
AWS_DEFAULT_ACL = None
AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"
AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}


# Media File Configuration
if LOCAL:
    MEDIA_URL = '/mediafiles/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'mediafiles')
    DEFAULT_FILES_STORAGE = 'django.core.files.storage.FileSystemStorage'
else:
    # s3 public media settings
    PUBLIC_MEDIA_LOCATION = 'media'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/{PUBLIC_MEDIA_LOCATION}/'
    DEFAULT_FILE_STORAGE = 'memebook.storage_backends.PublicMediaStorage'


# Static File Configuration
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR + '/static/'
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# International Settings
LANGUAGE_CODE = 'en-us'
USE_TZ = True
TIME_ZONE = 'America/New_York'

LOGIN_REDIRECT_URL = '/'
LOGIN_URL = '/login/'



# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
django_heroku.settings(locals())

