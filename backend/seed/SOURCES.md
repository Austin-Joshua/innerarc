# Indian Food 101 — ingredient lists for `seed_food.py`

**File:** `indian_food.csv` (vendored next to this note)

**Source:** [Indian Food 101 (Neha Prabhavalkar / Kaggle)](https://www.kaggle.com/datasets/nehaprabhavalkar/indian-food-101)

**Why it is in-repo:** `seed_food.py` needs this CSV to map dish names → ingredient
lists. The path under `ml/data/raw/` is gitignored (training downloads), so a
tracked copy lives here for clean installs.

**License:** Confirm on the Kaggle dataset page before redistributing further.
Community mirrors commonly treat the CSV as public-domain / CC0; we vendor it
only for local seeding. Re-download from Kaggle into this path if you prefer
not to use the committed file:

```
# destination (tracked seed path)
backend/seed/indian_food.csv

# legacy path also accepted by seed_food.py
ml/data/raw/indian_food.csv
```
