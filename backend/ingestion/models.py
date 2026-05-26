from django.db import models
from django.core.exceptions import ValidationError


class Company(models.Model):

    name = models.CharField(
        max_length=255
    )

    # temporary null=True for migrations
    created_at = models.DateTimeField(
        auto_now_add=True,
        null=True,
        blank=True
    )

    def __str__(self):
        return self.name


class DataSource(models.Model):

    SOURCE_CHOICES = [
        ("SAP", "SAP"),
        ("UTILITY", "UTILITY"),
        ("TRAVEL", "TRAVEL"),
    ]

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="sources"
    )

    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES
    )

    uploaded_file = models.FileField(
        upload_to="uploads/"
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        null=True,
        blank=True
    )

    # ingestion metadata

    file_name = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    total_rows = models.IntegerField(
        default=0
    )

    valid_rows = models.IntegerField(
        default=0
    )

    suspicious_rows = models.IntegerField(
        default=0
    )

    failed_rows = models.IntegerField(
        default=0
    )

    uploaded_by = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    processing_notes = models.TextField(
        blank=True,
        null=True
    )

    def __str__(self):

        return (
            f"{self.company.name} - "
            f"{self.source_type}"
        )


class EmissionRecord(models.Model):

    STATUS_CHOICES = [
        ("PENDING", "PENDING"),
        ("APPROVED", "APPROVED"),
        ("REJECTED", "REJECTED"),
        ("FAILED", "FAILED"),
        ("LOCKED", "LOCKED"),
    ]

    SCOPE_CHOICES = [
        ("SCOPE_1", "Scope 1"),
        ("SCOPE_2", "Scope 2"),
        ("SCOPE_3", "Scope 3"),
    ]

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="records"
    )

    source = models.ForeignKey(
        DataSource,
        on_delete=models.CASCADE,
        related_name="records"
    )

    # external source tracking

    external_reference = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    category = models.CharField(
        max_length=100
    )

    scope = models.CharField(
        max_length=20,
        choices=SCOPE_CHOICES
    )

    activity_type = models.CharField(
        max_length=100
    )

    quantity = models.FloatField()

    unit = models.CharField(
        max_length=50
    )

    # normalized values

    normalized_quantity = models.FloatField(
        null=True,
        blank=True
    )

    normalized_unit = models.CharField(
        max_length=50
    )

    # emissions

    emission_factor = models.FloatField(
        null=True,
        blank=True
    )

    emission_factor_source = (
        models.CharField(
            max_length=255,
            null=True,
            blank=True
        )
    )

    calculated_emissions = (
        models.FloatField(
            null=True,
            blank=True
        )
    )

    # preserve raw source payload

    raw_data = models.JSONField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    suspicious = models.BooleanField(
        default=False
    )

    failure_reason = models.TextField(
        null=True,
        blank=True
    )

    # analyst review workflow

    reviewed_by = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    notes = models.TextField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        null=True,
        blank=True
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        null=True,
        blank=True
    )

    class Meta:

        indexes = [

            models.Index(
                fields=["status"]
            ),

            models.Index(
                fields=["scope"]
            ),

            models.Index(
                fields=["suspicious"]
            ),

            models.Index(
                fields=["company"]
            ),

            models.Index(
                fields=["source"]
            ),
        ]

        ordering = ["-created_at"]

    def clean(self):

        # suspicious conditions

        if self.quantity < 0:
            self.suspicious = True

        # failed validation example

        if not self.unit:

            self.status = "FAILED"

            self.failure_reason = (
                "Missing unit value"
            )

        # utility validation

        if (
            self.source.source_type
            == "UTILITY"
            and self.quantity < 0
        ):

            self.status = "FAILED"

            self.failure_reason = (
                "Electricity usage "
                "cannot be negative"
            )

    def save(self, *args, **kwargs):

        # prevent edits to locked records

        if self.pk:

            old_record = (
                EmissionRecord.objects.get(
                    pk=self.pk
                )
            )

            if (
                old_record.status
                == "LOCKED"
            ):

                raise ValidationError(
                    "Locked records cannot "
                    "be modified."
                )

        self.clean()

        super().save(
            *args,
            **kwargs
        )

    def __str__(self):

        return (
            f"{self.activity_type} - "
            f"{self.status}"
        )


class AuditLog(models.Model):

    ACTION_CHOICES = [
        ("CREATE", "CREATE"),
        ("UPDATE", "UPDATE"),
        ("APPROVE", "APPROVE"),
        ("REJECT", "REJECT"),
        ("LOCK", "LOCK"),
        ("FAIL", "FAIL"),
    ]

    record = models.ForeignKey(
        EmissionRecord,
        on_delete=models.CASCADE,
        related_name="audit_logs"
    )

    action = models.CharField(
        max_length=100,
        choices=ACTION_CHOICES
    )

    changed_by = models.CharField(
        max_length=100
    )

    old_value = models.JSONField(
        null=True,
        blank=True
    )

    new_value = models.JSONField(
        null=True,
        blank=True
    )

    comment = models.TextField(
        blank=True,
        null=True
    )

    timestamp = models.DateTimeField(
        auto_now_add=True,
        null=True,
        blank=True
    )

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):

        return (
            f"{self.action} - "
            f"{self.timestamp}"
        )