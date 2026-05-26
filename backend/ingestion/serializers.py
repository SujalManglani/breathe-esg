from rest_framework import serializers

from .models import (
    Company,
    DataSource,
    EmissionRecord,
    AuditLog
)


class CompanySerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = Company
        fields = "__all__"


class DataSourceSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = DataSource
        fields = "__all__"


class AuditLogSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = AuditLog
        fields = "__all__"


class EmissionRecordSerializer(
    serializers.ModelSerializer
):

    source_type = serializers.CharField(
        source="source.source_type",
        read_only=True
    )

    uploaded_at = serializers.DateTimeField(
        source="source.uploaded_at",
        read_only=True
    )

    company_name = serializers.CharField(
        source="company.name",
        read_only=True
    )

    audit_logs = (
        AuditLogSerializer(
            many=True,
            read_only=True
        )
    )

    class Meta:

        model = EmissionRecord

        fields = "__all__"