# Scripts

Utility scripts for local development and demo data setup.

## Prerequisites

- Run from the `backend` folder.
- Activate virtualenv (optional but recommended):
  - PowerShell: `.\.venv\Scripts\Activate.ps1`

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
