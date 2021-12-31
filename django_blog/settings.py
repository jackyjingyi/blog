from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-$o)-z_5^_-$_nsn1fmru*irpcn@7b$7tcqmrv-lxnh1*x4g35z'

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'blog',
    'members',
    'rest_framework',
    'ckeditor',
    'corsheaders',
    'taggit',
    'taggit_labels',
    'crispy_forms',
    'ApprovalSystemOCT',
    'django_crontab',
    'guardian',
    # 'channels'
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',

    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

REST_FRAMEWORK = {
    # Use Django's standard `django.contrib.auth` permissions,
    # or allow read-only access for unauthenticated users.
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny'
    ],
    'DATETIME_FORMAT': "%Y-%m-%d %H:%M:%S.%f%z",  # only format match django format
}

CORS_ORIGIN_ALLOW_ALL = True
ROOT_URLCONF = 'django_blog.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

WSGI_APPLICATION = 'django_blog.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'blog',
        'USER': 'root',
        'PASSWORD': 'ew3402123',
        'HOST': '127.0.0.1',
        'PORT': '3306',
        # 'OPTIONS': {
        #     "init_command": "SET foreign_key_checks = 0;",
        # }
    }
}

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

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'guardian.backends.ObjectPermissionBackend',
)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

CRONJOBS = [
    ('*/5 * * * *', 'ApprovalSystemOCT.cron.processing_date_validator',
     f'>>/{BASE_DIR}/ApprovalSystemOCT/logs/cron/log/processing_date_validator.log')
]

LANGUAGE_CODE = 'en-us'
# USE_TZ=True
TIME_ZONE = 'Asia/Shanghai'

USE_I18N = True

USE_L10N = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
LOGIN_REDIRECT_URL = 'home'
LOGOUT_REDIRECT_URL = 'home'
# PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
STATIC_ROOT = ''
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    os.path.join(os.path.join('static')),
]

# ASGI_APPLICATION = "django_blog.asgi.application"

RABBITMQ = {
    "host": "172.25.118.154",
    "port": 5672
}
# SESSION_COOKIE_AGE = 60 * 60
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
# SESSION_SAVE_EVERY_REQUEST = True
STATUS_STATE = {
    'ApprovalSystemOCT': {
        'process': {
            'type': {
                'requirement': '1',
                'annual': '2'
            },
            'status': {
                'processing': '1',  # 进行中
                'success': '2',  # 成功走完流程
                'fail': '3',  # 中止或删除
                'stop': '4'
            },
            'state': {
                'processing': '0',
                'success': '1',  # success
                'delete': '2',  #
                'stop': '3',
                'packed': '4',
                'deny': '5',
            }

        },
        'task': {
            'type': {
                'input': '1',  # first task in process, allow create edit submit, delete
                'dispatch': '2',  # admin user dispatch requirements to new onwners, allow admin dispatch
                'edit': '3',  # new owner to re edit requirements  allow edit submit
                're-dispatch': '4',
                # admin to re-dispatch/packup/create  allow admin re-dispatch, create packup delete
                're-submit': '5',  # to annualproject allow user edit submit, allow leader approval deny
                'approval': '6',
                'implement': '7',
                'annual_init': '8'

            },
            'status': {
                'processing': '1',  #
                'success': '2',  # success
                'fail': '3'
            },
            'state': {
                'processing': '0',
                'success': '1',
                'delete': '2',
                'packed': '3',
                'deny': '4',
                'tech_fail': '5',
                'timing_fail': '6',
                'approve': '7',
                'pending': '8',
            }
        },
        'step': {
            'status': {
                'success': '1',
                'processing': '2',
            },
            'state': {
                'success': '1',  # current pace success
                'fail': '2',  # unexpected failure 500, 404 etc
            },
            'type': {
                'create': '1',  # first step, user allow create
                'edit': '2',  # second step, user allow edit
                'submit': '3',  # third step, user allow submit , including submit in any allowed tasks
                'approval': '4',  # forth step , user (leader) allow to approval
                'delete': '5',  # 5th step users ( admin or other authorized user) allow to delete
                'withdraw': '6',  # 6th step user allow to withdraw
                'deny': '7',  # allow user(leader) to deny
                'dispatch': '8',
                'pack-up': '9',
                'assign': '10',
                're-sub': '11',
                'occupy': '12',
            }
        },

    }
}

OBS_AK = "POC15HNEABZRTCXJXRR7"
OBS_SK = "koKUwzTk1KQD77FiAwrF6TfdyAqEqKIZKnlzlNJ7"

DING_TALK = {
    "ak": "dingutzogwdeslf3eb12",
    "sk": "6Ip4UT6p2DlIIZ3syA1RPUJimPfHZ4dEJpTnUdRxkpQYrf_aRKbmSCophsYFDnno",
    "agentid": "1349443920",
}
