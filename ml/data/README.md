# Innerarc ML datasets

This folder holds dataset notes and the curated dish list. **Do not download large datasets as part of Module 1.** Training starts in the Food and Nutrition module.

## Curated dish list

[`curated_dishes.json`](curated_dishes.json) is a proposed 30-class Core list mixing Indian dishes (IFCT 2017) and international dishes (Food-101 / USDA). Treat it as a placeholder until the Food module locks class names to recipes.

Target: ≥ 85% top-1 accuracy on this list (PRD / TRD).

## Food-101 (international dishes)

- Source: [Food-101](https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/)
- Paper: Bossard, Guillaumin, Van Gool, ECCV 2014
- When you are ready to train, download into `ml/data/raw/food-101/` (gitignored).
- Use only the subset of classes that appear in `curated_dishes.json`.

## Indian food dataset

Use an Indian food image dataset whose labels overlap the Indian names in `curated_dishes.json`, for example:

- [Indian Food Classification (Kaggle)](https://www.kaggle.com/datasets/iamsouravbanerjee/indian-food-images-dataset)
- Or a similarly licensed set with dish-level (not ingredient-level) labels

Download into `ml/data/raw/indian-food/` when training starts. Do not attempt pixel-level ingredient detection; labels are dish classes only.

## Nutrition sources (Food module, not this folder)

- USDA FoodData Central API — international dishes
- IFCT 2017 (ICMR-NIN) — Indian dishes

Ingredient inference is **dish classification → recipe lookup → nutrition table**, never visual ingredient segmentation (Core constraint).

## Pose / progress photos

Progress Intelligence uses MediaPipe Pose on user photos. Do not collect a public body-image training set; inference is off-the-shelf MediaPipe. Outputs are ratios and silhouette comparison only — never body-fat percentage.
