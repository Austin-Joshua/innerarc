# Innerarc ML

Stubs for the dish classifier (PyTorch) and pose pipeline (MediaPipe). Nothing here is trained or served in Module 1.

- `data/curated_dishes.json` — proposed 30-class Core list
- `data/README.md` — how to obtain Food-101 and an Indian food dataset later
- `src/classify.py` — dish-then-recipe inference (not pixel-level ingredients)
- `src/pose.py` — ratios and silhouette only (never body-fat %)

Install later with `pip install -r requirements.txt` in a GPU-capable environment when the Food module starts.
