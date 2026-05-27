from django.shortcuts import render
from django.utils import timezone
from django.db import transaction

import pandas as pd
import numpy as np

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    Company,
    DataSource,
    EmissionRecord,
    AuditLog
)

from .serializers import EmissionRecordSerializer


# -----------------------------------
# UNIT NORMALIZATION
# -----------------------------------

def normalize_unit(quantity, unit):
    unit = str(unit).strip().lower() if unit else ""

    conversions = {
        "gallon": (3.785, "liters"),
        "gal": (3.785, "liters"),
        "l": (1, "liters"),
        "liter": (1, "liters"),
        "liters": (1, "liters"),
        "kwh": (1, "kWh"),
        "mwh": (1000, "kWh"),
    }

    if unit in conversions:
        factor, normalized_unit = conversions[unit]
        return quantity * factor, normalized_unit

    return quantity, unit


# -----------------------------------
# SCOPE MAPPING
# -----------------------------------

def get_scope(source_type):
    return {
        "SAP": "SCOPE_1",
        "UTILITY": "SCOPE_2",
        "TRAVEL": "SCOPE_3",
    }.get(str(source_type).upper(), "SCOPE_3")


# -----------------------------------
# EMISSION FACTORS
# -----------------------------------

EMISSION_FACTORS = {
    "diesel": 2.68,
    "petrol": 2.31,
    "electricity": 0.82,
    "flight": 0.15,
}


def calculate_emissions(activity, quantity):
    factor = EMISSION_FACTORS.get(str(activity).lower(), 0)
    return factor, quantity * factor


# -----------------------------------
# SUSPICIOUS DETECTION
# -----------------------------------

def detect_suspicious(source_type, quantity, activity):
    try:
        if quantity is None or np.isnan(quantity):
            return True

        if quantity < 0:
            return True

        if pd.isna(activity):
            return True

        if source_type == "UTILITY" and quantity > 100000:
            return True

        if source_type == "TRAVEL" and quantity > 50000:
            return True

        return False

    except Exception:
        return True


# -----------------------------------
# GET RECORDS
# -----------------------------------

@api_view(["GET"])
def get_records(request):
    try:
        records = (
            EmissionRecord.objects
            .select_related("company", "source")
            .all()
            .order_by("-created_at")
        )

        return Response(
            EmissionRecordSerializer(records, many=True).data
        )

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# -----------------------------------
# DASHBOARD SUMMARY
# -----------------------------------

@api_view(["GET"])
def dashboard_summary(request):
    return Response({
        "total_records": EmissionRecord.objects.count(),
        "approved": EmissionRecord.objects.filter(status="APPROVED").count(),
        "rejected": EmissionRecord.objects.filter(status="REJECTED").count(),
        "locked": EmissionRecord.objects.filter(status="LOCKED").count(),
        "pending": EmissionRecord.objects.filter(status="PENDING").count(),
        "failed": EmissionRecord.objects.filter(status="FAILED").count(),
        "suspicious": EmissionRecord.objects.filter(suspicious=True).count(),
    })


# -----------------------------------
# CSV UPLOAD (SAFE VERSION)
# -----------------------------------

@api_view(["POST"])
def upload_csv(request):
    try:
        file = request.FILES.get("file")
        source_type = request.data.get("source_type")
        company_id = request.data.get("company_id")
        uploaded_by = request.data.get("uploaded_by", "system")

        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        if not company_id:
            return Response({"error": "Missing company_id"}, status=400)

        company = Company.objects.filter(id=company_id).first()
        if not company:
            return Response({"error": "Invalid company_id"}, status=400)

        try:
            df = pd.read_csv(file)
        except Exception as e:
            return Response({"error": "Invalid CSV", "details": str(e)}, status=400)

        data_source = DataSource.objects.create(
            company=company,
            source_type=source_type,
            uploaded_file=file,
            file_name=file.name,
            total_rows=len(df),
            uploaded_by=uploaded_by,
        )

        suspicious_count = 0
        valid_count = 0
        failed_count = 0

        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    quantity = row.get("Quantity", 0)
                    unit = row.get("Unit", "")
                    activity = row.get("Fuel Type") or row.get("Activity") or "Unknown"

                    if pd.isna(quantity):
                        quantity = 0

                    try:
                        quantity = float(quantity)
                    except:
                        quantity = 0

                    normalized_quantity, normalized_unit = normalize_unit(quantity, unit)

                    suspicious = detect_suspicious(source_type, quantity, activity)

                    emission_factor, calculated_emissions = calculate_emissions(
                        activity,
                        normalized_quantity
                    )

                    external_reference = row.get(
                        "Booking ID",
                        row.get("Meter ID", f"ROW-{index}")
                    )

                    status_value = "PENDING"
                    failure_reason = None

                    if suspicious:
                        suspicious_count += 1
                    else:
                        valid_count += 1

                    record = EmissionRecord.objects.create(
                        company=company,
                        source=data_source,
                        external_reference=external_reference,
                        category=source_type,
                        scope=get_scope(source_type),
                        activity_type=str(activity),
                        quantity=quantity,
                        unit=str(unit),
                        normalized_quantity=normalized_quantity,
                        normalized_unit=normalized_unit,
                        emission_factor=emission_factor,
                        emission_factor_source="DEFRA 2024",
                        calculated_emissions=calculated_emissions,
                        raw_data=row.to_dict(),
                        suspicious=suspicious,
                        status=status_value,
                        failure_reason=failure_reason
                    )

                    AuditLog.objects.create(
                        record=record,
                        action="CREATE",
                        changed_by=uploaded_by,
                        new_value=row.to_dict(),
                        comment="CSV ingestion"
                    )

                except Exception:
                    failed_count += 1
                    continue

        data_source.valid_rows = valid_count
        data_source.suspicious_rows = suspicious_count
        data_source.failed_rows = failed_count
        data_source.save()

        return Response({
            "message": "CSV uploaded successfully",
            "total_rows": len(df),
            "valid_rows": valid_count,
            "suspicious_rows": suspicious_count,
            "failed_rows": failed_count,
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# -----------------------------------
# UPDATE STATUS
# -----------------------------------

@api_view(["POST"])
def update_record_status(request, record_id):
    try:
        record = EmissionRecord.objects.filter(id=record_id).first()

        if not record:
            return Response({"error": "Record not found"}, status=404)

        if record.status == "LOCKED":
            return Response({"error": "Locked records cannot be modified"}, status=400)

        new_status = request.data.get("status")
        reviewer = request.data.get("reviewer", "admin")
        notes = request.data.get("notes", "")

        old_status = record.status
        record.status = new_status
        record.reviewed_by = reviewer
        record.reviewed_at = timezone.now()
        record.notes = notes
        record.save()

        AuditLog.objects.create(
            record=record,
            action="UPDATE",
            changed_by=reviewer,
            old_value={"status": old_status},
            new_value={"status": new_status},
            comment=notes
        )

        return Response({
            "message": "Status updated",
            "record_id": record.id,
            "new_status": new_status
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# -----------------------------------
# HTML PAGE
# -----------------------------------

def upload_page(request):
    return render(request, "ingestion/upload.html")