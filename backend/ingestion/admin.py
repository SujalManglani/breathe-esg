from django.contrib import admin

from .models import (
    Company,
    DataSource,
    EmissionRecord,
    AuditLog
)

admin.site.register(Company)
admin.site.register(DataSource)
admin.site.register(EmissionRecord)
admin.site.register(AuditLog)
