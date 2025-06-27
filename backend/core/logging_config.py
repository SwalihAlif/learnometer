import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,

    'formatters': {
        'file': {
            'format': '{levelname} {asctime} [{name}.{funcName}] {message}',
            'style': '{',
        },
        'color': {
            '()': 'colorlog.ColoredFormatter',
            'format': '%(log_color)s%(levelname)-8s %(asctime)s [%(name)s.%(funcName)s] %(message)s',
            'log_colors': {
                'DEBUG':    'cyan',
                'INFO':     'green',
                'WARNING':  'yellow',
                'ERROR':    'red',
                'CRITICAL': 'bold_red',
            },
        },
    },

    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'color',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/django.log'),
            'formatter': 'file',
        },
    },

    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'WARNING',
            'propagate': True,
        },
        'users': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'courses': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'topics': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'file'],
            'level': 'ERROR',
            'propagate': False,
        },
    },

    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
}



# import logging
#logger = logging.getLogger(__name__)
# __name__ ensures the logger uses the correct module name (e.g., users.views, courses.views), which matches the loggers you defined in logging_config.py.
# def my_view(request):
#     logger.debug("This is a debug message.")
#     logger.info("Something informative happened.")
#     logger.warning("This is a warning.")
#     logger.error("An error occurred.")
#     logger.critical("Critical issue!")

#     return JsonResponse({'message': 'Check your logs!'})
