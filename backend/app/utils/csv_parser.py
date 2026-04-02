from __future__ import annotations

from io import BytesIO
from typing import Any

import pandas as pd


def _first_present(row: dict[str, Any], keys: list[str], default: Any = None) -> Any:
    for key in keys:
        if key in row and pd.notna(row[key]):
            return row[key]
    return default


def _to_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    return text in {"1", "true", "yes", "y"}


def _to_int(value: Any) -> int | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _to_float(value: Any) -> float | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_students_list(value: Any) -> list[int] | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None

    if isinstance(value, list):
        parsed = [_to_int(v) for v in value]
        return [x for x in parsed if x is not None] or None

    text = str(value).strip()
    if not text:
        return None

    # Accept inputs like "35, 40, 38" or "35|40|38".
    for sep in ["|", ";"]:
        text = text.replace(sep, ",")

    parts = [p.strip() for p in text.split(",") if p.strip()]
    parsed = [_to_int(p) for p in parts]
    numbers = [x for x in parsed if x is not None]
    return numbers or None


def parse_teacher_upload(file_bytes: bytes, filename: str) -> list[dict[str, Any]]:
    lower_name = filename.lower()
    if lower_name.endswith(".csv"):
        df = pd.read_csv(BytesIO(file_bytes))
    elif lower_name.endswith(".xlsx") or lower_name.endswith(".xls"):
        df = pd.read_excel(BytesIO(file_bytes))
    else:
        raise ValueError("Unsupported file type. Use CSV or XLS/XLSX.")

    df = df.where(pd.notna(df), None)
    rows: list[dict[str, Any]] = []

    for idx, raw in enumerate(df.to_dict(orient="records"), start=2):
        email = _first_present(raw, ["email", "Email", "teacher_email"])
        full_name = _first_present(raw, ["full_name", "name", "Full Name", "teacher_name"], "")

        if not email:
            raise ValueError(f"Missing email at row {idx}")

        rows.append(
            {
                "email": str(email).strip().lower(),
                "full_name": str(full_name).strip() if full_name else "",
                "teacher_id_number": _first_present(raw, ["teacher_id_number", "teacher_id", "id_number"]),
                "school": _first_present(raw, ["school", "School"]),
                "region": _first_present(raw, ["region", "Region"]),
                "division": _first_present(raw, ["division", "Division"]),
                "province": _first_present(raw, ["province", "Province"]),
                "grade_level_taught": _first_present(raw, ["grade_level_taught", "grade_level", "grade"]),
                "current_subject": _first_present(raw, ["current_subject", "subject", "Subject"]),
                "specialization": _first_present(raw, ["specialization", "major"]),
                "teaching_outside_specialization": _to_bool(
                    _first_present(raw, ["teaching_outside_specialization", "out_of_field"]), False
                ),
                "years_experience": _to_int(_first_present(raw, ["years_experience", "experience_years"])),
                "num_classes": _to_int(_first_present(raw, ["num_classes", "class_count"])),
                "students_per_class": _to_students_list(
                    _first_present(raw, ["students_per_class", "class_sizes", "students"])
                ),
                "working_hours_per_week": _to_float(
                    _first_present(raw, ["working_hours_per_week", "weekly_hours"])
                ),
            }
        )

    return rows
