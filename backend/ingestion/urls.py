from django.urls import path

from .views import (
    get_records,
    update_record_status,
    upload_csv,
    upload_page,
    dashboard_summary
)

urlpatterns = [
    path("records/", get_records),
    path("upload/", upload_csv),
    path("upload-page/", upload_page),
    path("summary/", dashboard_summary),
    path(
        "record/<int:record_id>/status/",
        update_record_status
    ),
]