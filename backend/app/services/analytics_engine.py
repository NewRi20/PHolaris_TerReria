from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta
from math import ceil
from statistics import median

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.teacher_profile import TeacherProfile
from app.models.training import Training


def _months_since(d: date) -> float:
	return max((date.today() - d).days / 30.0, 0.0)


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
	return max(low, min(value, high))


async def specialization_proximity_score(db: AsyncSession) -> list[dict]:
	"""
	5.1 Specialization Proximity Score
	Score(region) = out_of_field / total * 100
	"""
	result = await db.execute(
		select(TeacherProfile.region, TeacherProfile.teaching_outside_specialization)
		.where(TeacherProfile.region.is_not(None))
	)

	grouped: dict[str, dict[str, int]] = defaultdict(lambda: {"total": 0, "out_of_field": 0})
	for region, outside in result.all():
		grouped[region]["total"] += 1
		if outside:
			grouped[region]["out_of_field"] += 1

	rows: list[dict] = []
	for region, stats in grouped.items():
		total = stats["total"]
		out_of_field = stats["out_of_field"]
		pct = (out_of_field / total * 100.0) if total else 0.0
		rows.append(
			{
				"region": region,
				"teacher_count": total,
				"out_of_field_count": out_of_field,
				"specialization_proximity_score": round(pct, 2),
			}
		)

	return sorted(rows, key=lambda x: x["specialization_proximity_score"], reverse=True)


async def training_drought_index(db: AsyncSession) -> list[dict]:
	"""
	5.2 Training Drought Index
	DroughtIndex = (MedianMonths / 36) * 0.6 + (ZeroTrainingRate / 100) * 0.4
	"""
	result = await db.execute(
		select(TeacherProfile.region, TeacherProfile.division, TeacherProfile.last_training_date)
		.where(TeacherProfile.region.is_not(None), TeacherProfile.division.is_not(None))
	)

	grouped: dict[tuple[str, str], list[date | None]] = defaultdict(list)
	for region, division, last_training_date in result.all():
		grouped[(region, division)].append(last_training_date)

	rows: list[dict] = []
	for (region, division), dates in grouped.items():
		total = len(dates)
		months_values = [_months_since(d) for d in dates if d is not None]
		median_months = float(median(months_values)) if months_values else 120.0

		no_recent_training = 0
		for d in dates:
			if d is None or _months_since(d) > 36.0:
				no_recent_training += 1

		zero_training_rate = (no_recent_training / total * 100.0) if total else 0.0
		drought_index = _clamp((median_months / 36.0) * 0.6 + (zero_training_rate / 100.0) * 0.4)

		rows.append(
			{
				"region": region,
				"division": division,
				"teacher_count": total,
				"median_months_since_last_training": round(median_months, 2),
				"zero_training_rate": round(zero_training_rate, 2),
				"training_drought_index": round(drought_index, 4),
			}
		)

	return sorted(rows, key=lambda x: x["training_drought_index"], reverse=True)


async def experience_void_ratio(db: AsyncSession) -> list[dict]:
	"""
	5.3 Experience Void Ratio
	Ratio(region) = novice(<3 years) / max(veteran(>10 years), 1)
	"""
	result = await db.execute(
		select(TeacherProfile.region, TeacherProfile.years_experience)
		.where(TeacherProfile.region.is_not(None))
	)

	grouped: dict[str, dict[str, int]] = defaultdict(lambda: {"novice": 0, "veteran": 0, "total": 0})
	for region, years_experience in result.all():
		grouped[region]["total"] += 1
		if years_experience is not None and years_experience < 3:
			grouped[region]["novice"] += 1
		if years_experience is not None and years_experience > 10:
			grouped[region]["veteran"] += 1

	rows: list[dict] = []
	for region, stats in grouped.items():
		novice = stats["novice"]
		veteran = stats["veteran"]
		ratio = novice / max(veteran, 1)
		rows.append(
			{
				"region": region,
				"teacher_count": stats["total"],
				"novice_teachers": novice,
				"veteran_teachers": veteran,
				"experience_void_ratio": round(ratio, 4),
			}
		)

	return sorted(rows, key=lambda x: x["experience_void_ratio"], reverse=True)


async def instructional_risk_index(db: AsyncSession) -> list[dict]:
	"""
	5.4 Instructional Risk Index
	Flag teacher when all three are true:
	- teaching_outside_specialization == True
	- years_experience < 3
	- last_training_date older than 3 years (or missing)
	"""
	result = await db.execute(
		select(
			TeacherProfile.school,
			TeacherProfile.region,
			TeacherProfile.teaching_outside_specialization,
			TeacherProfile.years_experience,
			TeacherProfile.last_training_date,
		)
		.where(TeacherProfile.region.is_not(None))
	)

	grouped: dict[str, dict[str, int | str]] = defaultdict(
		lambda: {"area_name": "", "area_type": "school", "total": 0, "flagged": 0}
	)

	for school, region, outside, years_experience, last_training_date in result.all():
		area_name = school or f"Unknown School ({region})"
		grouped[area_name]["area_name"] = area_name
		grouped[area_name]["total"] += 1

		training_is_stale = last_training_date is None or _months_since(last_training_date) > 36.0
		is_flagged = bool(outside) and (years_experience is not None and years_experience < 3) and training_is_stale
		if is_flagged:
			grouped[area_name]["flagged"] += 1

	rows: list[dict] = []
	for stats in grouped.values():
		total = int(stats["total"])
		flagged = int(stats["flagged"])
		risk_pct = (flagged / total * 100.0) if total else 0.0
		rows.append(
			{
				"area_name": str(stats["area_name"]),
				"area_type": "school",
				"flagged_teachers": flagged,
				"total_teachers": total,
				"instructional_risk_pct": round(risk_pct, 2),
			}
		)

	return sorted(rows, key=lambda x: x["instructional_risk_pct"], reverse=True)


async def burnout_capacity_index(db: AsyncSession) -> list[dict]:
	"""
	5.5 Burnout & Capacity Index
	BurnoutIndex = (num_classes * sum(students_per_class)) / working_hours_per_week
	Region-level value uses median teacher burnout index.
	"""
	result = await db.execute(
		select(
			TeacherProfile.region,
			TeacherProfile.num_classes,
			TeacherProfile.students_per_class,
			TeacherProfile.working_hours_per_week,
		)
		.where(TeacherProfile.region.is_not(None))
	)

	region_values: dict[str, list[float]] = defaultdict(list)
	region_student_loads: dict[str, list[float]] = defaultdict(list)
	region_hours: dict[str, list[float]] = defaultdict(list)

	for region, num_classes, students_per_class, working_hours in result.all():
		if not num_classes or not working_hours or working_hours <= 0:
			continue

		student_load = float(sum(students_per_class or []))
		burnout = (float(num_classes) * student_load) / float(working_hours)

		region_values[region].append(burnout)
		region_student_loads[region].append(student_load)
		region_hours[region].append(float(working_hours))

	rows: list[dict] = []
	for region, values in region_values.items():
		if not values:
			continue
		rows.append(
			{
				"region": region,
				"burnout_capacity_index": round(float(median(values)), 2),
				"average_student_load": round(sum(region_student_loads[region]) / len(region_student_loads[region]), 2),
				"average_working_hours_per_week": round(sum(region_hours[region]) / len(region_hours[region]), 2),
			}
		)

	return sorted(rows, key=lambda x: x["burnout_capacity_index"], reverse=True)


async def training_frequency_rate(db: AsyncSession) -> list[dict]:
	"""
	5.6 Training Frequency Rate
	TrainingFrequency(teacher) = trainings_attended / max(years_experience, 1)
	RegionalRate = average of teacher-level rates per region.
	"""
	result = await db.execute(
		select(TeacherProfile.id, TeacherProfile.region, TeacherProfile.years_experience, Training.id)
		.outerjoin(Training, Training.teacher_id == TeacherProfile.id)
		.where(TeacherProfile.region.is_not(None))
	)

	teachers: dict[str, dict] = {}
	for teacher_id, region, years_experience, training_id in result.all():
		key = str(teacher_id)
		if key not in teachers:
			teachers[key] = {
				"region": region,
				"years_experience": years_experience,
				"training_count": 0,
			}
		if training_id is not None:
			teachers[key]["training_count"] += 1

	region_rates: dict[str, list[float]] = defaultdict(list)
	for teacher in teachers.values():
		denominator = max(int(teacher["years_experience"] or 0), 1)
		rate = float(teacher["training_count"]) / float(denominator)
		region_rates[teacher["region"]].append(rate)

	rows: list[dict] = []
	for region, rates in region_rates.items():
		if not rates:
			continue
		rows.append(
			{
				"region": region,
				"training_frequency_rate": round(sum(rates) / len(rates), 4),
			}
		)

	return sorted(rows, key=lambda x: x["training_frequency_rate"], reverse=True)


async def subject_gap_index(db: AsyncSession) -> list[dict]:
	"""
	5.7 Subject Gap Index
	Practical demand model for current dataset:
	- supply(region, subject) = teacher count for region+subject
	- demand(region, subject) = ceil(total_teachers_in_region / distinct_subjects_in_region)
	- subject_gap = demand - supply (positive means shortage)
	"""
	result = await db.execute(
		select(TeacherProfile.region, TeacherProfile.current_subject)
		.where(TeacherProfile.region.is_not(None), TeacherProfile.current_subject.is_not(None))
	)

	region_totals: dict[str, int] = defaultdict(int)
	region_subject_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

	for region, subject in result.all():
		region_totals[region] += 1
		region_subject_counts[region][subject] += 1

	rows: list[dict] = []
	for region, subjects in region_subject_counts.items():
		total = region_totals[region]
		distinct_subjects = max(len(subjects), 1)
		estimated_needed = ceil(total / distinct_subjects)

		for subject, supply in subjects.items():
			gap = estimated_needed - supply
			rows.append(
				{
					"region": region,
					"subject": subject,
					"teacher_count": supply,
					"estimated_needed": estimated_needed,
					"subject_gap_index": gap,
					"shortage": max(gap, 0),
				}
			)

	return sorted(rows, key=lambda x: x["shortage"], reverse=True)


async def regional_readiness_score(db: AsyncSession) -> list[dict]:
	"""
	5.8 Regional Readiness Score (composite)
	Uses currently implemented metrics and normalizes each to [0, 1].
	"""
	specialization = await specialization_proximity_score(db)
	drought = await training_drought_index(db)
	experience = await experience_void_ratio(db)
	risk = await instructional_risk_index(db)
	burnout = await burnout_capacity_index(db)
	subject_gap = await subject_gap_index(db)

	regions = set()
	for item in specialization:
		regions.add(item["region"])
	for item in drought:
		regions.add(item["region"])
	for item in experience:
		regions.add(item["region"])
	for item in burnout:
		regions.add(item["region"])
	for item in subject_gap:
		regions.add(item["region"])

	# region -> metric values
	sp_map = {item["region"]: item["specialization_proximity_score"] for item in specialization}

	drought_group: dict[str, list[float]] = defaultdict(list)
	for item in drought:
		drought_group[item["region"]].append(item["training_drought_index"])
	dr_map = {region: (sum(vals) / len(vals)) for region, vals in drought_group.items()}

	ex_map = {item["region"]: item["experience_void_ratio"] for item in experience}
	bu_map = {item["region"]: item["burnout_capacity_index"] for item in burnout}

	sg_group: dict[str, list[float]] = defaultdict(list)
	for item in subject_gap:
		sg_group[item["region"]].append(float(item["shortage"]))
	sg_map = {region: (sum(vals) / len(vals)) for region, vals in sg_group.items()}

	# risk currently school-based; infer region from area_name when possible
	rk_group: dict[str, list[float]] = defaultdict(list)
	for item in risk:
		area_name = item["area_name"]
		if "Unknown School (" in area_name and area_name.endswith(")"):
			region = area_name.split("Unknown School (")[-1][:-1]
			rk_group[region].append(float(item["instructional_risk_pct"]))
	rk_map = {region: (sum(vals) / len(vals)) for region, vals in rk_group.items()}

	def _normalize(values_by_region: dict[str, float]) -> dict[str, float]:
		if not values_by_region:
			return {}
		values = list(values_by_region.values())
		v_min = min(values)
		v_max = max(values)
		if v_max == v_min:
			return {k: 0.0 for k in values_by_region}
		return {k: (v - v_min) / (v_max - v_min) for k, v in values_by_region.items()}

	n_sp = _normalize(sp_map)
	n_dr = _normalize(dr_map)
	n_ex = _normalize(ex_map)
	n_rk = _normalize(rk_map)
	n_bu = _normalize(bu_map)
	n_sg = _normalize(sg_map)

	rows: list[dict] = []
	for region in sorted(regions):
		readiness = 1.0 - (
			0.20 * n_sp.get(region, 0.0)
			+ 0.25 * n_dr.get(region, 0.0)
			+ 0.15 * n_ex.get(region, 0.0)
			+ 0.20 * n_rk.get(region, 0.0)
			+ 0.10 * n_bu.get(region, 0.0)
			+ 0.10 * n_sg.get(region, 0.0)
		)
		readiness = _clamp(readiness)

		flagged = 0
		flagged += int(n_sp.get(region, 0.0) >= 0.75)
		flagged += int(n_dr.get(region, 0.0) >= 0.75)
		flagged += int(n_ex.get(region, 0.0) >= 0.75)
		flagged += int(n_rk.get(region, 0.0) >= 0.75)
		flagged += int(n_bu.get(region, 0.0) >= 0.75)
		flagged += int(n_sg.get(region, 0.0) >= 0.75)

		if readiness < 0.20:
			color = "red"
		elif readiness < 0.40:
			color = "orange"
		elif readiness < 0.60:
			color = "yellow"
		elif readiness < 0.80:
			color = "blue"
		else:
			color = "green"

		rows.append(
			{
				"region": region,
				"regional_readiness_score": round(readiness, 4),
				"metrics_flagged_count": flagged,
				"color_code": color,
			}
		)

	return sorted(rows, key=lambda x: x["regional_readiness_score"])


async def training_impact_velocity(db: AsyncSession) -> list[dict]:
	"""
	5.9 Training Impact Velocity
	Practical version with current tables:
	- recent_window: trainings in last 6 months
	- previous_window: trainings in 6-12 months ago
	- velocity = (recent_rate - previous_rate)
	"""
	now = datetime.utcnow().date()
	recent_start = now - timedelta(days=180)
	previous_start = now - timedelta(days=360)

	result = await db.execute(
		select(TeacherProfile.region, Training.date_attended)
		.outerjoin(Training, Training.teacher_id == TeacherProfile.id)
		.where(TeacherProfile.region.is_not(None))
	)

	teacher_counts: dict[str, int] = defaultdict(int)
	recent_counts: dict[str, int] = defaultdict(int)
	previous_counts: dict[str, int] = defaultdict(int)
	seen_teachers: set[tuple[str, str]] = set()

	teacher_result = await db.execute(select(TeacherProfile.id, TeacherProfile.region).where(TeacherProfile.region.is_not(None)))
	for teacher_id, region in teacher_result.all():
		key = (str(teacher_id), region)
		if key not in seen_teachers:
			teacher_counts[region] += 1
			seen_teachers.add(key)

	for region, attended in result.all():
		if attended is None:
			continue
		if attended >= recent_start:
			recent_counts[region] += 1
		elif previous_start <= attended < recent_start:
			previous_counts[region] += 1

	rows: list[dict] = []
	for region, total_teachers in teacher_counts.items():
		if total_teachers <= 0:
			continue

		recent_rate = recent_counts[region] / total_teachers
		previous_rate = previous_counts[region] / total_teachers
		velocity = recent_rate - previous_rate

		rows.append(
			{
				"region": region,
				"recent_training_rate": round(recent_rate, 4),
				"previous_training_rate": round(previous_rate, 4),
				"training_impact_velocity": round(velocity, 4),
				"trend": "improving" if velocity > 0 else ("declining" if velocity < 0 else "stable"),
			}
		)

	return sorted(rows, key=lambda x: x["training_impact_velocity"]) 


async def predictive_workforce_model(db: AsyncSession) -> list[dict]:
	"""
	5.10 Predictive Workforce Model
	Practical baseline with current data:
	- projected_hires: 5% of current headcount
	- projected_retirements: 3% of current headcount
	- projected_demand: ceil(current * 1.08)
	"""
	result = await db.execute(select(TeacherProfile.region).where(TeacherProfile.region.is_not(None)))

	counts: dict[str, int] = defaultdict(int)
	for (region,) in result.all():
		counts[region] += 1

	rows: list[dict] = []
	for region, current in counts.items():
		projected_hires = ceil(current * 0.05)
		projected_retirements = ceil(current * 0.03)
		projected_demand = ceil(current * 1.08)

		workforce_projection = current + projected_hires - projected_retirements
		projected_shortage = projected_demand - workforce_projection

		rows.append(
			{
				"region": region,
				"current_teacher_count": current,
				"projected_hires": projected_hires,
				"projected_retirements": projected_retirements,
				"projected_teacher_demand": projected_demand,
				"workforce_projection": workforce_projection,
				"projected_shortage": projected_shortage,
				"status": "shortage" if projected_shortage > 0 else "surplus",
			}
		)

	return sorted(rows, key=lambda x: x["projected_shortage"], reverse=True)


async def uplift_priority_queue(db: AsyncSession, top_n: int = 5) -> list[dict]:
	"""Top underserved regions based on combined readiness and shortage signals."""
	readiness = await regional_readiness_score(db)
	subject_gap = await subject_gap_index(db)

	gap_by_region: dict[str, float] = defaultdict(float)
	for row in subject_gap:
		gap_by_region[row["region"]] += float(row["shortage"])

	rows: list[dict] = []
	for item in readiness:
		region = item["region"]
		priority_score = (1.0 - float(item["regional_readiness_score"])) * 100.0 + gap_by_region.get(region, 0.0)
		rows.append(
			{
				"region": region,
				"priority_score": round(priority_score, 2),
				"metrics_flagged_count": item["metrics_flagged_count"],
				"color_code": item["color_code"],
			}
		)

	rows = sorted(rows, key=lambda x: x["priority_score"], reverse=True)[: max(top_n, 1)]
	for idx, row in enumerate(rows, start=1):
		row["rank"] = idx
	return rows


async def region_metric_detail(db: AsyncSession, region: str) -> dict:
	"""Combined metric detail for a single region."""
	specialization = await specialization_proximity_score(db)
	drought = await training_drought_index(db)
	experience = await experience_void_ratio(db)
	burnout = await burnout_capacity_index(db)
	training_frequency = await training_frequency_rate(db)
	readiness = await regional_readiness_score(db)
	predictive = await predictive_workforce_model(db)

	def _pick(items: list[dict], key: str, default=0.0):
		for item in items:
			if item.get("region") == region:
				return item.get(key, default)
		return default

	return {
		"region": region,
		"specialization_proximity_score": _pick(specialization, "specialization_proximity_score", None),
		"training_drought_index": _pick(drought, "training_drought_index", None),
		"experience_void_ratio": _pick(experience, "experience_void_ratio", None),
		"burnout_capacity_index": _pick(burnout, "burnout_capacity_index", None),
		"training_frequency_rate": _pick(training_frequency, "training_frequency_rate", None),
		"regional_readiness_score": _pick(readiness, "regional_readiness_score", None),
		"color_code": _pick(readiness, "color_code", None),
		"projected_shortage": _pick(predictive, "projected_shortage", None),
	}


async def analytics_overview(db: AsyncSession) -> dict:
	"""High-level dashboard payload across regions."""
	readiness = await regional_readiness_score(db)
	workforce = await predictive_workforce_model(db)

	shortage_regions = len([row for row in workforce if row["status"] == "shortage"])
	critical_regions = len([row for row in readiness if row["color_code"] in {"red", "orange"}])

	return {
		"generated_at": datetime.utcnow().isoformat(),
		"total_regions": len(readiness),
		"critical_regions": critical_regions,
		"shortage_regions": shortage_regions,
		"readiness": readiness,
	}


async def build_analytics_snapshot(db: AsyncSession) -> dict:
	"""Stable snapshot contract for AI and dashboard consumers."""
	specialization = await specialization_proximity_score(db)
	drought = await training_drought_index(db)
	experience = await experience_void_ratio(db)
	risk = await instructional_risk_index(db)
	burnout = await burnout_capacity_index(db)
	training_frequency = await training_frequency_rate(db)
	subject_gap = await subject_gap_index(db)
	readiness = await regional_readiness_score(db)
	impact_velocity = await training_impact_velocity(db)
	predictive_workforce = await predictive_workforce_model(db)
	uplift_priority = await uplift_priority_queue(db)

	return {
		"specialization_proximity": specialization,
		"training_drought": drought,
		"experience_void": experience,
		"instructional_risk": risk,
		"burnout_capacity": burnout,
		"training_frequency": training_frequency,
		"subject_gap": subject_gap,
		"regional_readiness": readiness,
		"training_impact_velocity": impact_velocity,
		"predictive_workforce": predictive_workforce,
		"uplift_priority": uplift_priority,
	}