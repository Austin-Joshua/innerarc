# Progress-pose smoke fixtures (Module 4)

Used by `smoke_progress_pose.py`, `smoke_gamification.py`, and
`smoke_usability.py`.

| Local file | Purpose |
| --- | --- |
| `good_standing.jpg` | Full-body standing pose that MediaPipe should accept |
| `bad_dark.jpg` | Too-dark / invalid pose — expect HTTP 422 from the API |
| `bad_blank.jpg` | Near-empty image (optional extra negative) |

These are small Innerarc smoke fixtures (not third-party downloads). Keep them
next to this file under `backend/scripts/fixtures/progress/`.

Legacy path (gitignored): `ml/data/raw/progress_samples/` — still accepted by
the smoke script if the fixtures directory is missing.
