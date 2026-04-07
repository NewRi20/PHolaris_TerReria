# Scripts

Utility scripts for local development and demo data setup.

## Prerequisites

- Run from the `backend` folder.
- Activate virtualenv (optional but recommended):
  - PowerShell: `.\.venv\Scripts\Activate.ps1`

## Context Data Setup (`backend/.context`)

`seed_demo_data.py` reads source data from `backend/.context`.

Create this folder structure first:

```text
backend/
  .context/
    regions_provinces.json
    school_names.json
    names/
      pop_names.csv
    surnames/
      surname.txt
```

Required for name generation (at least one valid approach):

- Option A (recommended): provide both `names/pop_names.csv` and `surnames/surname.txt`
- Option B: provide `full_name.json` directly in `.context` with a non-empty `full_names` array

If you use Option A, the script auto-generates `.context/full_name.json`.

### File Formats

`regions_provinces.json`:

```json
{
  "regions": [
    {
      "code": "R4A",
      "name": "Region IV-A (CALABARZON)",
      "provinces": ["Laguna", "Cavite", "Batangas"]
    }
  ]
}
```

`school_names.json`:

```json
{
  "schools_by_region": {
    "R4A": ["Laguna National High School", "Cavite Integrated School"],
    "R3": ["Pampanga Science High School"]
  }
}
```

`names/pop_names.csv`:

```csv
forename
Maria
Juan
Jose
```

`surnames/surname.txt`:

```text
[[Dela Cruz]]
[[Santos]]
[[Reyes]]
```

Optional `full_name.json` (if you want to skip source name files):

```json
{
  "meta": {},
  "first_names": ["Maria", "Juan"],
  "surnames": ["Santos", "Reyes"],
  "full_names": ["Maria Santos", "Juan Reyes"]
}
```

## Available Scripts

### `seed_admin.py`

Creates or updates an admin account interactively.

Run:

```powershell
python scripts/seed_admin.py
```

You will be prompted for:

- Admin email
- Admin password
- Admin full name

### `seed_demo_data.py`

Seeds demo teachers, trainings, badges, and optional events/votes/RSVPs/sentiments.

Run with defaults:

```powershell
python scripts/seed_demo_data.py
```

Run with custom counts:

```powershell
python scripts/seed_demo_data.py --teachers 500 --events 20 --votes-per-event 60 --rsvps-per-event 40 --sentiments-per-event 20
```

Show all options:

```powershell
python scripts/seed_demo_data.py --help
```

### `reset_teacher_record.py`

Resets or deletes a single teacher record safely through SQLAlchemy.

This is useful when direct deletes in Neon fail due to foreign key constraints.

Reset by email (keeps user account, recreates empty teacher profile):

```powershell
python scripts/reset_teacher_record.py --email teacher@example.com
```

Delete entire account and profile:

```powershell
python scripts/reset_teacher_record.py --email teacher@example.com --delete-user
```

Preview only (no commit):

```powershell
python scripts/reset_teacher_record.py --email teacher@example.com --dry-run
```
