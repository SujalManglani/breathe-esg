from django.shortcuts import render
from django.utils import timezone
from django.db import transaction

import pandas as pd

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Company, DataSource, EmissionRecord, AuditLog


# -----------------------------
# HEALTH CHECK (IMPORTANT FOR CHOREO)
# -----------------------------
@api_view(["GET"])
def health(request):
    return Response({
        "status": "ok",
        "service": "ingestion"
    })


# -----------------------------
# UNIT NORMALIZATION
# -----------------------------
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


# -----------------------------
# SCOPE MAPPING
# -----------------------------
def get_scope(source_type):
    if not source_type:
        return "SCOPE_3"

    return {
        "SAP": "SCOPE_1",
        "UTILITY": "SCOPE_2",
        "TRAVEL": "SCOPE_3",
    }.get(str(source_type).upper(), "SCOPE_3")


# -----------------------------
# EMISSION FACTORS
# -----------------------------
EMISSION_FACTORS = {
    "diesel": 2.68,
    "petrol": 2.31,
    "electricity": 0.82,
    "flight": 0.15,
}


def calculate_emissions(activity, quantity):
    try:
        factor = EMISSION_FACTORS.get(str(activity).lower(), 0)
        return factor, float(quantity) * float(factor)
    except Exception:
        return 0, 0


# -----------------------------
# GET RECORDS (ADMIN TABLE SAFE)
# -----------------------------
@api_view(["GET"])
def get_records(request):
    try:
        records = EmissionRecord.objects.all().order_by("-id")

        data = []
        for r in records:
            data.append({
                "id": r.id,
                "activity_type": r.activity_type,
                "scope": r.scope,
                "quantity": r.quantity,
                "unit": r.unit,
                "normalized_quantity": r.normalized_quantity,
                "normalized_unit": r.normalized_unit,
                "status": r.status,
                "suspicious": r.suspicious,
            })

        return Response(data)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# -----------------------------
# DASHBOARD SUMMARY
# -----------------------------
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


# -----------------------------
# CSV UPLOAD
# -----------------------------
@api_view(["POST"])
def upload_csv(request):
    try:
        file = request.FILES.get("file")
        source_type = request.data.get("source_type")
        company_id = request.data.get("company_id")
        uploaded_by = request.data.get("uploaded_by", "system")

        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        company = Company.objects.filter(id=company_id).first()
        if not company:
            return Response({"error": "Invalid company_id"}, status=400)

        df = pd.read_csv(file)

        data_source = DataSource.objects.create(
            company=company,
            source_type=source_type,
            uploaded_file=file,
            file_name=file.name,
            total_rows=len(df),
            uploaded_by=uploaded_by,
        )

        valid = suspicious = failed = 0

        with transaction.atomic():
            for i, row in df.iterrows():
                try:
                    quantity = float(row.get("Quantity", 0) or 0)
                    unit = row.get("Unit", "")
                    activity = row.get("Fuel Type") or row.get("Activity") or "Unknown"

                    normalized_q, normalized_u = normalize_unit(quantity, unit)

                    suspicious_flag = quantity < 0 or quantity > 100000

                    factor, emissions = calculate_emissions(activity, normalized_q)

                    ref = row.get("Booking ID") or row.get("Meter ID") or f"ROW-{i}"

                    EmissionRecord.objects.create(
                        company=company,
                        source=data_source,
                        external_reference=ref,
                        category=source_type,
                        scope=get_scope(source_type),
                        activity_type=str(activity),
                        quantity=quantity,
                        unit=str(unit),
                        normalized_quantity=normalized_q,
                        normalized_unit=normalized_u,
                        emission_factor=factor,
                        emission_factor_source="DEFRA 2024",
                        calculated_emissions=emissions,
                        raw_data=str(row.to_dict()),
                        suspicious=suspicious_flag,
                        status="PENDING",
                        failure_reason=None
                    )

                    if suspicious_flag:
                        suspicious += 1
                    else:
                        valid += 1

                except Exception:
                    failed += 1

        data_source.valid_rows = valid
        data_source.suspicious_rows = suspicious
        data_source.failed_rows = failed
        data_source.save()

        return Response({
            "message": "Upload successful",
            "total": len(df),
            "valid": valid,
            "suspicious": suspicious,
            "failed": failed
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# -----------------------------
# UPDATE STATUS
# -----------------------------
@api_view(["POST"])
def update_record_status(request, record_id):
    record = EmissionRecord.objects.filter(id=record_id).first()

    if not record:
        return Response({"error": "Record not found"}, status=404)

    if record.status == "LOCKED":
        return Response({"error": "Locked record"}, status=400)

    new_status = request.data.get("status")

    record.status = new_status
    record.reviewed_by = request.data.get("reviewer", "admin")
    record.reviewed_at = timezone.now()
    record.notes = request.data.get("notes", "")
    record.save()

    AuditLog.objects.create(
        record=record,
        action="UPDATE",
        changed_by=record.reviewed_by,
        old_value={"status": "previous"},
        new_value={"status": new_status},
        comment=record.notes
    )

    return Response({"message": "Updated"})


# -----------------------------
# UI PAGE
# -----------------------------
def upload_page(request):
    return render(request, "ingestion/upload.html")