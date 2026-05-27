from django.urls import path
from .views import (
    get_records,
    upload_csv,
    upload_page,
    dashboard_summary,
    update_record_status
)

urlpatterns = [
    path("records/", get_records),
    path("upload/", upload_csv),
    path("upload-page/", upload_page),
    path("summary/", dashboard_summary),
    path("record/<int:record_id>/status/", update_record_status),
]