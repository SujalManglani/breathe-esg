from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

from django.conf import settings
from django.conf.urls.static import static


def home(request):
    return JsonResponse({
        "status": "Backend running",
        "message": "Use /api/ endpoints"
    })


urlpatterns = [
    path('', home),  # ✅ ADD THIS LINE (IMPORTANT)

    path('admin/', admin.site.urls),

    path('api/', include('ingestion.urls')),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )