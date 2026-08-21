# Food seed data for clean installs

## What clean installs need

**Tracked file:** [`dishes.json`](dishes.json) — dish nutrition + ingredient lists
for all Core classes. `python -u scripts/seed_food.py` uses this alone.

No third-party CSV is required for seeding.

## Optional legacy: Kaggle Indian Food 101 CSV

**Do not vendor `indian_food.csv` into this repo.**

| Field | Value |
| --- | --- |
| Dataset | [Indian Food 101 (Neha Prabhavalkar)](https://www.kaggle.com/datasets/nehaprabhavalkar/indian-food-101) |
| Kaggle `licenseName` (API, 2026-08-21) | **Data files © Original Authors** |
| Size | 28 306 bytes |

That license is **not** CC0 / public domain. Redistributing the CSV into a
public GitHub tree is not permitted under Kaggle’s “Data files © Original
Authors” terms. An earlier Module 15 attempt briefly committed a copy; that
was incorrect and has been removed.

If you still want the CSV locally for optional enrichment / research, download
it yourself from Kaggle into the gitignored path:

```
ml/data/raw/indian_food.csv
```

`seed_food.py` will use it only as a fallback for IFCT rows that lack inline
ingredients in `dishes.json` (none do, after the samosa seed row was completed).
