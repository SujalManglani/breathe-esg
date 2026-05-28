from django.urls import path
from .views import (
    health,
    get_records,
    dashboard_summary,
    upload_csv,
    update_record_status,
    upload_page,
)

urlpatterns = [
    path("health/", health),
    path("records/", get_records),
    path("dashboard/", dashboard_summary),
    path("upload/", upload_csv),
    path("update/<int:record_id>/", update_record_status),
    path("", upload_page),
]