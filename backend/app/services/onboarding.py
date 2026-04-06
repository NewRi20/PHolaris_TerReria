from __future__ import annotations

from typing import Any

from app.models.teacher_profile import TeacherProfile


REQUIRED_TEXT_FIELDS = (
    "teacher_id_number",
    "school",
    "region",
    "province",
    "grade_level_taught",
    "current_subject",
)


def _has_text(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def is_teacher_profile_complete(profile: TeacherProfile | None) -> bool:
    if profile is None:
        return False

    for field_name in REQUIRED_TEXT_FIELDS:
        if not _has_text(getattr(profile, field_name, None)):
            return False

    if profile.years_experience is None or profile.years_experience < 0:
        return False

    if profile.num_classes is None or profile.num_classes <= 0:
        return False

    if profile.working_hours_per_week is None or profile.working_hours_per_week <= 0:
        return False

    students_per_class = profile.students_per_class
    if not isinstance(students_per_class, list) or len(students_per_class) == 0:
        return False

    if not all(isinstance(value, int) and value > 0 for value in students_per_class):
        return False

    return True