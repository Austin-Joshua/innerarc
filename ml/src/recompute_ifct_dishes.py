"""Recompute IFCT-sourced nutrition for the 15 Indian dishes from local IFCT2017 extract.

One-shot pipeline:
  1) ensure proximate catalog exists (parse PDF text if missing)
  2) recompute dish nutrition + coverage
  3) update backend/seed/dishes.json
  4) write expanded JSON + Markdown reports
"""

from __future__ import annotations

import csv
import json
import re
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT / "ml" / "data" / "raw" / "ifct2017_proximate.json"
PDF_PATH = ROOT / "ml" / "data" / "raw" / "IFCT2017.pdf"
TXT_PATH = ROOT / "ml" / "data" / "raw" / "IFCT2017.txt"
SEED_PATH = ROOT / "backend" / "seed" / "dishes.json"
REPORT_JSON = ROOT / "ml" / "reports" / "ifct2017_dish_recompute.json"
REPORT_MD = ROOT / "ml" / "reports" / "ifct2017_dish_recompute.md"
PARSE_SCRIPT = ROOT / "ml" / "src" / "parse_ifct_proximate.py"

COVERAGE_HIGH_THRESHOLD = 85.0
COVERAGE_MEDIUM_THRESHOLD = 70.0


def coverage_to_confidence(coverage_pct: float) -> str:
    """high >=85%, medium 70-<85%, low <70%."""
    if coverage_pct >= COVERAGE_HIGH_THRESHOLD:
        return "high"
    if coverage_pct >= COVERAGE_MEDIUM_THRESHOLD:
        return "medium"
    return "low"


INDIAN_15 = [
    "biryani",
    "paneer_butter_masala",
    "dal_tadka",
    "palak_paneer",
    "butter_chicken",
    "chana_masala",
    "dal_makhani",
    "chicken_tikka_masala",
    "naan",
    "jalebi",
    "gulab_jamun",
    "poha",
    "kachori",
    "aloo_gobi",
    "kadai_paneer",
]
SPOT_CHECK = ("poha", "dal_tadka", "biryani")

SUPPLEMENTAL_FOODS: dict[str, dict] = {
    "T012": {
        "code": "T012",
        "name": "Ghee (IFCT Edible Oils and Fats; Table 12 fatty-acid profile)",
        "moisture": 0.0,
        "protein": 0.0,
        "ash": 0.0,
        "fat": 100.0,
        "carbs": 0.0,
        "energy_kj": 3765.6,
        "calories": 900.0,
        "source_note": (
            "No Table-1 proximate row for T012; IFCT lists ghee under Edible Oils and Fats "
            "(fatty-acid table). Values use IFCT Atwater fat factor (9 kcal/g) for a pure lipid food."
        ),
    },
}

INGREDIENT_MAP: dict[str, str | None] = {
    "chicken thighs": "N002",
    "chicken": "N002",
    "skinless chicken breasts": "N003",
    "paneer": "L003",
    "cottage cheese": "L003",
    "milk": "L002",
    "milk powder": None,
    "greek yogurt": None,
    "cream": None,
    "whipping cream": None,
    "heavy cream": None,
    "butter": None,
    "ghee": "T012",
    "curd": None,
    "basmati rice": "A015",
    "beaten rice flakes": "A011",
    "whole wheat flour": "A019",
    "plain flour": "A018",
    "maida": "A018",
    "dough": "A018",
    "rava": "A022",
    "corn flour": None,
    "pigeon peas": "B021",
    "chickpeas": "B002",
    "red kidney beans": "B020",
    "urad dal": "B003",
    "moong dal": "B010",
    "cauliflower": "D036",
    "potato": "F006",
    "palak": "C033",
    "bell peppers": "D033",
    "tomato paste": "D076",
    "tomato sauce": "D076",
    "ginger": "G014",
    "red onion": "G017",
    "garlic": "G011",
    "green chillies": "G008",
    "green chilies": "G008",
    "curry leaves": "G010",
    "lemon juice": "E033",
    "kasuri methi": "C020",
    "cashew nuts": "H005",
    "turmeric": "G033",
    "cardamom": "G020",
    "chili powder": "G022",
    "fennel seeds": None,
    "star anise": None,
    "saffron": None,
    "garam masala": None,
    "garam masala powder": None,
    "honey": None,
    "sugar": "I001",
    "sugar syrup": "I001",
    "baking powder": None,
    "baking soda": None,
    "vinegar": None,
    "avocado oil": None,
    "rose water": None,
    "water": None,
    "sweet": None,
    "gravy": None,
    "naan bread": None,
}

ESTIMATES: dict[str, dict[str, float]] = {
    "biryani": {
        "Chicken thighs": 150,
        "basmati rice": 100,
        "star anise": 2,
        "sweet": 0,
        "green chillies": 10,
    },
    "butter_chicken": {
        "Chicken": 150,
        "greek yogurt": 40,
        "cream": 40,
        "garam masala powder": 4,
        "cashew nuts": 15,
        "butter": 20,
    },
    "chana_masala": {
        "Chickpeas": 80,
        "tomato paste": 40,
        "garam masala": 4,
        "ginger": 8,
        "red onion": 50,
        "avocado oil": 10,
    },
    "chicken_tikka_masala": {
        "Naan bread": 0,
        "tomato sauce": 80,
        "skinless chicken breasts": 150,
        "heavy cream": 40,
        "garam masala": 4,
    },
    "dal_makhani": {
        "Red kidney beans": 40,
        "urad dal": 60,
        "cream": 30,
        "garam masala": 3,
        "chili powder": 2,
    },
    "dal_tadka": {
        "Pigeon peas": 70,
        "garam masala": 3,
        "ginger": 8,
        "red onion": 40,
        "kasuri methi": 2,
    },
    "poha": {
        "Beaten rice flakes": 80,
        "potato": 40,
        "curry leaves": 3,
        "green chilies": 5,
        "lemon juice": 8,
    },
    "kachori": {
        "Moong dal": 25,
        "rava": 10,
        "garam masala": 2,
        "dough": 50,
        "fennel seeds": 2,
    },
    "kadai_paneer": {
        "Cottage cheese": 100,
        "bell peppers": 50,
        "gravy": 80,
        "garam masala": 3,
        "cashew nuts": 10,
    },
    "naan": {"Whole wheat flour": 70, "honey": 5, "butter": 8, "garlic": 4},
    "palak_paneer": {
        "Cottage cheese": 80,
        "palak": 120,
        "cream": 20,
        "garam masala": 3,
        "butter": 10,
    },
    "paneer_butter_masala": {
        "Paneer": 100,
        "whipping cream": 40,
        "garam masala": 3,
        "cashew nuts": 15,
        "butter": 15,
    },
    "gulab_jamun": {
        "Milk powder": 40,
        "plain flour": 8,
        "baking powder": 1,
        "ghee": 15,
        "milk": 20,
        "sugar": 40,
        "water": 30,
        "rose water": 2,
    },
    "jalebi": {
        "Maida": 50,
        "corn flour": 5,
        "baking soda": 1,
        "vinegar": 2,
        "curd": 20,
        "water": 30,
        "turmeric": 1,
        "saffron": 0.2,
        "cardamom": 1,
        "sugar syrup": 50,
        "ghee": 15,
    },
    "aloo_gobi": {
        "Cauliflower": 150,
        "potato": 100,
        "garam masala": 3,
        "turmeric": 2,
        "curry leaves": 3,
    },
}

MANUAL_EXTRA_INGREDIENTS: dict[str, list[str]] = {
    "jalebi": ["sugar syrup", "ghee"],
}


def _norm(name: str) -> str:
    return re.sub(r"\s+", " ", name).strip().lower()


def round_macros(
    calories: float, protein: float, carbs: float, fat: float
) -> dict[str, float]:
    return {
        "calories": round(calories, 1),
        "protein": round(protein, 2),
        "carbs": round(carbs, 2),
        "fat": round(fat, 2),
    }


def ensure_catalog() -> dict[str, dict]:
    if not CATALOG_PATH.exists():
        if not TXT_PATH.exists():
            raise FileNotFoundError(
                f"Missing {TXT_PATH}; download/extract IFCT2017.pdf first"
            )
        subprocess.check_call([sys.executable, str(PARSE_SCRIPT)], cwd=str(ROOT))
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    catalog.update(SUPPLEMENTAL_FOODS)
    return catalog


def estimate_qty(estimates: dict[str, float], name: str) -> float:
    if name in estimates:
        return float(estimates[name])
    key = name.lower()
    for est_key, est_val in estimates.items():
        if est_key.lower() == key:
            return float(est_val)
    return 0.0


def compute_dish(class_name: str, ingredient_names: list[str], catalog: dict) -> dict:
    estimates = ESTIMATES[class_name]
    rows: list[dict] = []
    matched_mass = 0.0
    total_estimated_mass = 0.0
    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}
    codes: list[str] = []
    unmatched: list[str] = []
    supplemental_codes: list[str] = []

    for name in ingredient_names:
        key = _norm(name)
        qty = estimate_qty(estimates, name)
        code = INGREDIENT_MAP[key] if key in INGREDIENT_MAP else None
        entry: dict = {
            "name": name,
            "estimated_quantity_g": qty,
            "typical_quantity": f"{qty:g} g (estimated)" if qty else "0 g (excluded)",
            "ifct_code": code,
        }
        total_estimated_mass += qty
        if code is None:
            entry["ifct_match"] = "none"
            if qty > 0:
                unmatched.append(name)
            rows.append(entry)
            continue
        food = catalog[code]
        entry["ifct_name"] = food["name"]
        if food.get("source_note"):
            entry["ifct_source_note"] = food["source_note"]
            if code not in supplemental_codes:
                supplemental_codes.append(code)
        entry["ifct_per_100g"] = {
            "calories": food["calories"],
            "protein": food["protein"],
            "carbs": food["carbs"],
            "fat": food["fat"],
        }
        scale = qty / 100.0
        contrib = {
            "calories": food["calories"] * scale,
            "protein": food["protein"] * scale,
            "carbs": food["carbs"] * scale,
            "fat": food["fat"] * scale,
        }
        entry["contribution"] = {k: round(v, 2) for k, v in contrib.items()}
        for k in totals:
            totals[k] += contrib[k]
        matched_mass += qty
        if code not in codes:
            codes.append(code)
        rows.append(entry)

    if matched_mass <= 0:
        per_100 = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}
    else:
        per_100 = round_macros(
            totals["calories"] * 100 / matched_mass,
            totals["protein"] * 100 / matched_mass,
            totals["carbs"] * 100 / matched_mass,
            totals["fat"] * 100 / matched_mass,
        )

    coverage_pct = (
        round(100.0 * matched_mass / total_estimated_mass, 1)
        if total_estimated_mass
        else 0.0
    )
    return {
        "class_name": class_name,
        "display_name": class_name.replace("_", " ").title(),
        "ingredients": rows,
        "ifct_food_codes": codes,
        "matched_mass_g": round(matched_mass, 1),
        "unmatched_mass_g": round(total_estimated_mass - matched_mass, 1),
        "total_estimated_mass_g": round(total_estimated_mass, 1),
        "match_coverage_pct": coverage_pct,
        "nutrition_confidence": coverage_to_confidence(coverage_pct),
        "nutrition_per_100g": per_100,
        "fully_matched": len(unmatched) == 0,
        "unmatched_ingredients": unmatched,
        "supplemental_ifct_codes": supplemental_codes,
        "computation": {
            "formula": "per_100g = sum(IFCT_per_100g * qty_g / 100) / matched_mass_g * 100",
            "coverage_formula": "match_coverage_pct = matched_mass_g / total_estimated_mass_g * 100",
            "coverage_threshold_pct": COVERAGE_MEDIUM_THRESHOLD,
            "confidence_tiers": {
                "high": f">= {COVERAGE_HIGH_THRESHOLD:g}%",
                "medium": f"{COVERAGE_MEDIUM_THRESHOLD:g}-<{COVERAGE_HIGH_THRESHOLD:g}%",
                "low": f"<{COVERAGE_MEDIUM_THRESHOLD:g}%",
            },
            "totals_before_normalize": {k: round(v, 2) for k, v in totals.items()},
        },
    }


def csv_ingredients() -> dict[str, list[str]]:
    path = ROOT / "ml" / "data" / "raw" / "indian_food.csv"
    out: dict[str, list[str]] = {}
    with path.open(encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            out[_norm(row["name"])] = [
                p.strip() for p in row["ingredients"].split(",") if p.strip()
            ]
    return out


UNMATCHED_REASONS: dict[str, str] = {
    "butter": "no_table1_proximate (dairy fat absent from IFCT Table 1)",
    "cream": "no_table1_proximate (dairy fat absent from IFCT Table 1)",
    "whipping cream": "no_table1_proximate (dairy fat absent from IFCT Table 1)",
    "heavy cream": "no_table1_proximate (dairy fat absent from IFCT Table 1)",
    "greek yogurt": "no_table1_proximate (yogurt/curd absent from IFCT Table 1)",
    "curd": "no_table1_proximate (yogurt/curd absent from IFCT Table 1)",
    "honey": "no_table1_proximate (mentioned in narrative only)",
    "avocado oil": "no_table1_proximate (oils only in fatty-acid Table 12; not mapped to Atwater here)",
    "garam masala": "blend (no single IFCT food code)",
    "garam masala powder": "blend (no single IFCT food code)",
    "gravy": "prepared_composite (not a raw IFCT food)",
    "naan bread": "prepared_dish (not a raw IFCT food)",
    "star anise": "no_ifct_entry (Illicium not listed)",
    "fennel seeds": "no_ifct_entry (Foeniculum not listed)",
    "saffron": "no_ifct_entry",
    "rose water": "no_ifct_entry",
    "corn flour": "no_close_match (maize starch ≠ A006 dry maize grain)",
    "baking powder": "additive (not a food composition entry)",
    "baking soda": "additive (not a food composition entry)",
    "vinegar": "no_ifct_entry",
    "milk powder": "no_close_match (not forced to L004 Khoa)",
    "water": "zero_macro_solvent (no IFCT food code; mass only)",
    "sweet": "csv_noise (non-ingredient token)",
}


def unmatched_reason(name: str) -> str:
    return UNMATCHED_REASONS.get(_norm(name), "unmapped (no approved IFCT match)")


def atwater_kcal(protein: float, carbs: float, fat: float) -> float:
    return round(protein * 4 + carbs * 4 + fat * 9, 1)


def enrich_dish(result: dict, seed_dish: dict) -> dict:
    """Attach serving-scale macros, Atwater check, count coverage, blockers."""
    n = result["nutrition_per_100g"]
    atwater = atwater_kcal(n["protein"], n["carbs"], n["fat"])
    delta = round(n["calories"] - atwater, 1)
    serving = int(seed_dish.get("default_serving_g") or 0)
    scale = serving / 100.0 if serving else 0.0
    active = [i for i in result["ingredients"] if i["estimated_quantity_g"] > 0]
    matched_n = sum(1 for i in active if i.get("ifct_code"))
    blockers = []
    for name in result["unmatched_ingredients"]:
        qty = next(
            (
                i["estimated_quantity_g"]
                for i in result["ingredients"]
                if i["name"] == name
            ),
            0.0,
        )
        blockers.append(
            {
                "ingredient": name,
                "estimated_quantity_g": qty,
                "share_of_total_mass_pct": (
                    round(100.0 * qty / result["total_estimated_mass_g"], 1)
                    if result["total_estimated_mass_g"]
                    else 0.0
                ),
                "reason": unmatched_reason(name),
            }
        )
    blockers.sort(key=lambda b: -b["estimated_quantity_g"])
    result["default_serving_g"] = serving
    result["nutrition_per_default_serving"] = (
        round_macros(
            n["calories"] * scale,
            n["protein"] * scale,
            n["carbs"] * scale,
            n["fat"] * scale,
        )
        if serving
        else None
    )
    result["atwater_check"] = {
        "reported_calories": n["calories"],
        "atwater_4p_4c_9f": atwater,
        "delta_kcal": delta,
        "relative_error_pct": (
            round(100.0 * abs(delta) / n["calories"], 1) if n["calories"] else 0.0
        ),
        "ok": abs(delta) <= max(8.0, 0.08 * n["calories"]),
    }
    result["ingredient_count_coverage_pct"] = (
        round(100.0 * matched_n / len(active), 1) if active else 0.0
    )
    result["matched_ingredient_count"] = matched_n
    result["active_ingredient_count"] = len(active)
    result["unmatched_blockers"] = blockers
    result["quality_flags"] = []
    if result["nutrition_confidence"] == "low":
        result["quality_flags"].append("coverage_below_threshold")
    if result["supplemental_ifct_codes"]:
        result["quality_flags"].append("uses_supplemental_oil_fat_values")
    if any(i.get("ifct_code") == "I001" for i in result["ingredients"]):
        result["quality_flags"].append("sugar_proxied_as_jaggery_i001")
    if not result["atwater_check"]["ok"]:
        result["quality_flags"].append("atwater_energy_mismatch")
    # raw dry staples dominate some cooked dishes
    if any(
        c in result["ifct_food_codes"]
        for c in ("A015", "B021", "B002", "B003", "B010", "B020")
    ):
        result["quality_flags"].append("raw_staple_basis_may_overstate_cooked_density")
    return result


def build_summary(dishes: list[dict], catalog: dict) -> dict:
    coverages = [d["match_coverage_pct"] for d in dishes]
    total_matched = sum(d["matched_mass_g"] for d in dishes)
    total_mass = sum(d["total_estimated_mass_g"] for d in dishes)
    low = [d for d in dishes if d["nutrition_confidence"] == "low"]
    medium = [d for d in dishes if d["nutrition_confidence"] == "medium"]
    high = [d for d in dishes if d["nutrition_confidence"] == "high"]
    at_or_above_medium = [
        d for d in dishes if d["nutrition_confidence"] in ("high", "medium")
    ]
    unmatched_freq: Counter[str] = Counter()
    unmatched_mass: Counter[str] = Counter()
    code_usage: Counter[str] = Counter()
    reason_mass: Counter[str] = Counter()
    for dish in dishes:
        for name in dish["unmatched_ingredients"]:
            unmatched_freq[name] += 1
        for ing in dish["ingredients"]:
            qty = ing["estimated_quantity_g"]
            code = ing.get("ifct_code")
            if code is None and qty > 0:
                unmatched_mass[ing["name"]] += qty
                reason_mass[unmatched_reason(ing["name"])] += qty
            if code:
                code_usage[code] += 1

    code_inventory = []
    for code, uses in code_usage.most_common():
        food = catalog[code]
        code_inventory.append(
            {
                "code": code,
                "name": food["name"],
                "uses_across_dishes": uses,
                "per_100g": {
                    "calories": food["calories"],
                    "protein": food["protein"],
                    "carbs": food["carbs"],
                    "fat": food["fat"],
                },
                "supplemental": code in SUPPLEMENTAL_FOODS,
                "source_note": food.get("source_note"),
            }
        )

    mapping_table = [
        {
            "ingredient": name,
            "ifct_code": code,
            "ifct_name": (catalog[code]["name"] if code else None),
            "status": "matched" if code else "unmatched",
            "reason": None if code else unmatched_reason(name),
        }
        for name, code in sorted(INGREDIENT_MAP.items())
    ]

    ranked = sorted(dishes, key=lambda d: (-d["match_coverage_pct"], d["class_name"]))
    sorted_cov = sorted(coverages)
    median = sorted_cov[len(sorted_cov) // 2]

    verdict = (
        f"{len(at_or_above_medium)}/{len(dishes)} dishes meet the {COVERAGE_MEDIUM_THRESHOLD:g}% mass-coverage bar "
        f"({len(high)} high, {len(medium)} medium, {len(low)} low). "
        f"Mean coverage {round(sum(coverages)/len(coverages), 1)}%, mass-weighted "
        f"{round(100.0 * total_matched / total_mass, 1)}%. "
        f"Primary remaining gaps are dairy fats/cream and dessert milk powder - absent from IFCT Table 1."
    )

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "verdict": verdict,
        "n_dishes": len(dishes),
        "coverage_threshold_pct": COVERAGE_MEDIUM_THRESHOLD,
        "coverage_high_threshold_pct": COVERAGE_HIGH_THRESHOLD,
        "coverage_mean_pct": round(sum(coverages) / len(coverages), 1),
        "coverage_median_pct": median,
        "coverage_mass_weighted_pct": (
            round(100.0 * total_matched / total_mass, 1) if total_mass else 0.0
        ),
        "coverage_min_pct": min(coverages),
        "coverage_max_pct": max(coverages),
        "total_matched_mass_g": round(total_matched, 1),
        "total_estimated_mass_g": round(total_mass, 1),
        "n_high_confidence": len(high),
        "n_medium_confidence": len(medium),
        "n_low_confidence": len(low),
        "n_atwater_ok": sum(1 for d in dishes if d["atwater_check"]["ok"]),
        "fully_matched_dishes": [d["class_name"] for d in dishes if d["fully_matched"]],
        "low_confidence_dishes": [
            {
                "class_name": d["class_name"],
                "display_name": d["display_name"],
                "match_coverage_pct": d["match_coverage_pct"],
                "ingredient_count_coverage_pct": d["ingredient_count_coverage_pct"],
                "unmatched_mass_g": d["unmatched_mass_g"],
                "nutrition_per_100g": d["nutrition_per_100g"],
                "top_blockers": d["unmatched_blockers"][:4],
                "quality_flags": d["quality_flags"],
            }
            for d in sorted(low, key=lambda d: d["match_coverage_pct"])
        ],
        "coverage_leaderboard": [
            {
                "class_name": d["class_name"],
                "display_name": d["display_name"],
                "match_coverage_pct": d["match_coverage_pct"],
                "ingredient_count_coverage_pct": d["ingredient_count_coverage_pct"],
                "nutrition_confidence": d["nutrition_confidence"],
                "matched_mass_g": d["matched_mass_g"],
                "unmatched_mass_g": d["unmatched_mass_g"],
                "total_estimated_mass_g": d["total_estimated_mass_g"],
                "default_serving_g": d["default_serving_g"],
                "nutrition_per_100g": d["nutrition_per_100g"],
                "nutrition_per_default_serving": d["nutrition_per_default_serving"],
                "atwater_ok": d["atwater_check"]["ok"],
                "ifct_food_codes": d["ifct_food_codes"],
                "quality_flags": d["quality_flags"],
            }
            for d in ranked
        ],
        "unmatched_ingredient_frequency": [
            {
                "ingredient": name,
                "dish_count": count,
                "total_estimated_g_across_dishes": round(unmatched_mass[name], 1),
                "reason": unmatched_reason(name),
            }
            for name, count in unmatched_freq.most_common()
        ],
        "unmatched_mass_by_reason": [
            {"reason": reason, "total_estimated_g": round(grams, 1)}
            for reason, grams in reason_mass.most_common()
        ],
        "ingredient_to_ifct_map": mapping_table,
        "ifct_code_inventory": code_inventory,
        "limitations": [
            "IFCT values are for raw edible portions; cooked dishes absorb water/oil not always listed in CSV.",
            "estimated_quantity_g values are household recipe estimates, not weighed lab measures.",
            "Normalization uses matched mass only, so unmatched high-calorie fats (butter/cream) bias density.",
            "Sugar uses I001 cane jaggery as the IFCT Sugars-group proxy; refined white sugar is not tabulated.",
            "Ghee uses supplemental T012 Atwater lipid values because Table 1 has no oil/fat proximate rows.",
            "Milk powder was not forced to L004 Khoa (related but not identical).",
            "Indian_Food_Nutrition_Processed.csv is cross-reference only and was not used as IFCT.",
        ],
        "sources": {
            "pdf": "ml/data/raw/IFCT2017.pdf" if PDF_PATH.exists() else None,
            "pdf_bytes": PDF_PATH.stat().st_size if PDF_PATH.exists() else None,
            "extracted_text": "ml/data/raw/IFCT2017.txt" if TXT_PATH.exists() else None,
            "proximate_catalog": "ml/data/raw/ifct2017_proximate.json",
            "catalog_foods": len(catalog) - len(SUPPLEMENTAL_FOODS),
            "supplemental_foods": list(SUPPLEMENTAL_FOODS),
            "seed": "backend/seed/dishes.json",
            "csv_ingredients": "ml/data/raw/indian_food.csv",
            "report_json": "ml/reports/ifct2017_dish_recompute.json",
            "report_md": "ml/reports/ifct2017_dish_recompute.md",
        },
        "methodology": {
            "ingredient_lists": "indian_food.csv (+ manual sugar syrup/ghee on jalebi)",
            "quantities": "estimated_quantity_g household estimates; not lab-measured",
            "nutrient_source": "IFCT 2017 Table-1 proximate where available",
            "sugar": "I001 Jaggery, cane (Sugars group; refined sugar absent)",
            "ghee": "T012 supplemental Atwater lipid from oils/fats group",
            "normalization": "matched-mass only; unmatched excluded from numerator and denominator",
            "coverage": "match_coverage_pct = matched_mass_g / total_estimated_mass_g * 100",
            "confidence_rule": (
                f"high>={COVERAGE_HIGH_THRESHOLD:g}%; "
                f"medium {COVERAGE_MEDIUM_THRESHOLD:g}-<{COVERAGE_HIGH_THRESHOLD:g}%; "
                f"low<{COVERAGE_MEDIUM_THRESHOLD:g}%"
            ),
            "atwater_check": "flag when |reported_kcal - (4P+4C+9F)| exceeds max(8 kcal, 8% of reported)",
        },
    }


def _fmt_macros(n: dict | None) -> str:
    if not n:
        return "-"
    return f"{n['calories']} kcal / P {n['protein']} / C {n['carbs']} / F {n['fat']}"


def _dish_worksheet(dish: dict) -> list[str]:
    lines = [
        f"### {dish['display_name']} (`{dish['class_name']}`)",
        "",
        f"- Mass coverage: **{dish['match_coverage_pct']}%** "
        f"({dish['matched_mass_g']} / {dish['total_estimated_mass_g']} g)",
        f"- Ingredient-count coverage: **{dish['ingredient_count_coverage_pct']}%** "
        f"({dish['matched_ingredient_count']}/{dish['active_ingredient_count']})",
        f"- Confidence: **{dish['nutrition_confidence']}**",
        f"- Per 100 g: {_fmt_macros(dish['nutrition_per_100g'])}",
        f"- Default serving ({dish['default_serving_g']} g): "
        f"{_fmt_macros(dish['nutrition_per_default_serving'])}",
        f"- Atwater check: reported {dish['atwater_check']['reported_calories']} vs "
        f"{dish['atwater_check']['atwater_4p_4c_9f']} "
        f"(Δ {dish['atwater_check']['delta_kcal']}, "
        f"{'OK' if dish['atwater_check']['ok'] else 'FLAG'})",
        f"- IFCT codes: `{'`, `'.join(dish['ifct_food_codes']) or 'none'}`",
    ]
    if dish["quality_flags"]:
        lines.append(f"- Flags: {', '.join(dish['quality_flags'])}")
    lines += [
        "",
        "| Ingredient | g | % mass | Code | IFCT food | Source kcal/P/C/F per 100g | Contribution |",
        "|---|---:|---:|---|---|---|---|",
    ]
    total = dish["total_estimated_mass_g"] or 1.0
    for ing in dish["ingredients"]:
        pct = round(100.0 * ing["estimated_quantity_g"] / total, 1)
        code = ing.get("ifct_code") or "-"
        food = (ing.get("ifct_name") or unmatched_reason(ing["name"]))[:48]
        if ing.get("ifct_per_100g"):
            s = ing["ifct_per_100g"]
            src = f"{s['calories']}/{s['protein']}/{s['carbs']}/{s['fat']}"
        else:
            src = "-"
        if ing.get("contribution"):
            c = ing["contribution"]
            contrib = f"{c['calories']}/{c['protein']}/{c['carbs']}/{c['fat']}"
        else:
            contrib = "-"
        lines.append(
            f"| {ing['name']} | {ing['estimated_quantity_g']} | {pct}% | {code} | {food} | {src} | {contrib} |"
        )
    t = dish["computation"]["totals_before_normalize"]
    lines += [
        "",
        f"Sum over matched mass {dish['matched_mass_g']} g → {t} → normalize ×100/"
        f"{dish['matched_mass_g']} = **{_fmt_macros(dish['nutrition_per_100g'])}**",
        "",
    ]
    if dish["unmatched_blockers"]:
        lines.append("Unmatched blockers:")
        for b in dish["unmatched_blockers"]:
            lines.append(
                f"- {b['ingredient']} ({b['estimated_quantity_g']} g, "
                f"{b['share_of_total_mass_pct']}%): {b['reason']}"
            )
        lines.append("")
    return lines


def write_markdown(report: dict) -> None:
    summary = report["summary"]
    lines = [
        "# IFCT 2017 Indian dish nutrition - full audit",
        "",
        f"Generated: `{summary['generated_at']}`",
        "",
        "## Executive verdict",
        "",
        summary["verdict"],
        "",
        "## Headline metrics",
        "",
        "| Metric | Value |",
        "|---|---|",
        f"| Dishes audited | {summary['n_dishes']} |",
        f"| Mean mass coverage | **{summary['coverage_mean_pct']}%** |",
        f"| Median mass coverage | {summary['coverage_median_pct']}% |",
        f"| Mass-weighted coverage | **{summary['coverage_mass_weighted_pct']}%** |",
        f"| Range | {summary['coverage_min_pct']}% - {summary['coverage_max_pct']}% |",
        f"| High confidence (>={summary['coverage_high_threshold_pct']}%) | {summary['n_high_confidence']} |",
        f"| Medium confidence ({summary['coverage_threshold_pct']}-<{summary['coverage_high_threshold_pct']}%) | {summary['n_medium_confidence']} |",
        f"| Low confidence (<{summary['coverage_threshold_pct']}%) | {summary['n_low_confidence']} |",
        f"| Fully matched dishes | {', '.join(summary['fully_matched_dishes']) or 'none'} |",
        f"| Atwater energy OK | {summary['n_atwater_ok']}/{summary['n_dishes']} |",
        f"| Total matched / estimated mass | {summary['total_matched_mass_g']} / {summary['total_estimated_mass_g']} g |",
        "",
        "## Coverage leaderboard",
        "",
        "| Rank | Dish | Mass cov. | Count cov. | Conf. | Matched g | Unmatched g | Serving | per 100g | per serving | Atwater |",
        "|---:|---|---:|---:|---|---:|---:|---:|---|---|---|",
    ]
    for i, row in enumerate(summary["coverage_leaderboard"], start=1):
        n = row["nutrition_per_100g"]
        s = row["nutrition_per_default_serving"]
        lines.append(
            f"| {i} | {row['display_name']} | {row['match_coverage_pct']}% | "
            f"{row['ingredient_count_coverage_pct']}% | {row['nutrition_confidence']} | "
            f"{row['matched_mass_g']} | {row['unmatched_mass_g']} | {row['default_serving_g']} g | "
            f"{n['calories']}/{n['protein']}/{n['carbs']}/{n['fat']} | "
            f"{_fmt_macros(s)} | {'OK' if row['atwater_ok'] else 'FLAG'} |"
        )

    lines += ["", "## Low-confidence dishes (detail)", ""]
    if not summary["low_confidence_dishes"]:
        lines.append("None.")
    else:
        for row in summary["low_confidence_dishes"]:
            lines.append(
                f"### {row['display_name']} - {row['match_coverage_pct']}% mass / "
                f"{row['ingredient_count_coverage_pct']}% count"
            )
            lines.append("")
            lines.append(f"Per 100 g: {_fmt_macros(row['nutrition_per_100g'])}")
            lines.append("")
            lines.append("| Blocker | g | % of recipe | Reason |")
            lines.append("|---|---:|---:|---|")
            for b in row["top_blockers"]:
                lines.append(
                    f"| {b['ingredient']} | {b['estimated_quantity_g']} | "
                    f"{b['share_of_total_mass_pct']}% | {b['reason']} |"
                )
            if row["quality_flags"]:
                lines.append("")
                lines.append(f"Flags: {', '.join(row['quality_flags'])}")
            lines.append("")

    lines += [
        "",
        "## Gap analysis - unmatched mass by reason",
        "",
        "| Reason | Total estimated g across dishes |",
        "|---|---:|",
    ]
    for row in summary["unmatched_mass_by_reason"]:
        lines.append(f"| {row['reason']} | {row['total_estimated_g']} |")

    lines += [
        "",
        "## Unmatched ingredient frequency",
        "",
        "| Ingredient | Dishes | Total g | Reason |",
        "|---|---:|---:|---|",
    ]
    for row in summary["unmatched_ingredient_frequency"]:
        lines.append(
            f"| {row['ingredient']} | {row['dish_count']} | "
            f"{row['total_estimated_g_across_dishes']} | {row['reason']} |"
        )

    lines += [
        "",
        "## Ingredient to IFCT mapping registry",
        "",
        "| CSV / recipe token | Code | IFCT name / reason | Status |",
        "|---|---|---|---|",
    ]
    for row in summary["ingredient_to_ifct_map"]:
        detail = row["ifct_name"] if row["status"] == "matched" else row["reason"]
        code = row["ifct_code"] or "-"
        lines.append(f"| {row['ingredient']} | {code} | {detail} | {row['status']} |")

    lines += [
        "",
        "## IFCT codes used in this recompute",
        "",
        "| Code | Name | Dish uses | kcal | P | C | F | Supplemental |",
        "|---|---|---:|---:|---:|---:|---:|---|",
    ]
    for row in summary["ifct_code_inventory"]:
        p = row["per_100g"]
        lines.append(
            f"| {row['code']} | {row['name'][:55]} | {row['uses_across_dishes']} | "
            f"{p['calories']} | {p['protein']} | {p['carbs']} | {p['fat']} | {row['supplemental']} |"
        )

    lines += ["", "## Full dish worksheets (all 15)", ""]
    for dish in sorted(report["dishes"], key=lambda d: -d["match_coverage_pct"]):
        lines.extend(_dish_worksheet(dish))

    lines += [
        "## Methodology",
        "",
        *[
            f"- **{k.replace('_', ' ')}**: {v}"
            for k, v in summary["methodology"].items()
        ],
        "",
        "## Limitations & interpretation",
        "",
        *[f"- {item}" for item in summary["limitations"]],
        "",
        "## Sources",
        "",
        *[f"- **{k.replace('_', ' ')}**: `{v}`" for k, v in summary["sources"].items()],
        "",
        "---",
        "",
        "*Regenerate with:* `backend/.venv/Scripts/python.exe -u ml/src/recompute_ifct_dishes.py`",
        "",
    ]
    REPORT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    catalog = ensure_catalog()
    seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    csv_map = csv_ingredients()
    by_class = {d["class_name"]: d for d in seed["dishes"]}
    dishes: list[dict] = []

    seed["notes"]["ifct"] = (
        "IFCT 2017 PDF at ml/data/raw/IFCT2017.pdf; text ml/data/raw/IFCT2017.txt; "
        "proximate catalog ml/data/raw/ifct2017_proximate.json. "
        "Dish nutrition_per_100g = weighted sum of matched ingredient IFCT values using "
        "estimated_quantity_g, normalized by matched mass only. "
        "match_coverage_pct = matched grams / total estimated grams; "
        f"nutrition_confidence tiers: high>={COVERAGE_HIGH_THRESHOLD:g}%, "
        f"medium {COVERAGE_MEDIUM_THRESHOLD:g}-<{COVERAGE_HIGH_THRESHOLD:g}%, "
        f"low<{COVERAGE_MEDIUM_THRESHOLD:g}%. USDA dishes use high / null coverage. "
        "Sugar maps to I001 Jaggery, cane (IFCT Sugars group; refined sugar absent). "
        "Ghee maps to T012 via supplemental Atwater lipid values (IFCT oils/fats fatty-acid "
        "table has no Table-1 proximate). Butter/cream/yogurt remain unmatched. "
        "Full audit: ml/reports/ifct2017_dish_recompute.md (+ .json). "
        "Indian_Food_Nutrition_Processed.csv is cross-reference only."
    )

    for class_name in INDIAN_15:
        dish = by_class[class_name]
        names = csv_map.get(_norm(dish["name"])) or csv_map.get(
            class_name.replace("_", " ")
        )
        if not names:
            raise KeyError(class_name)
        names = list(names) + MANUAL_EXTRA_INGREDIENTS.get(class_name, [])
        result = enrich_dish(compute_dish(class_name, names, catalog), dish)
        result["display_name"] = dish["name"]
        dish["nutrition_source"] = "ifct_2017"
        dish["nutrition_confidence"] = result["nutrition_confidence"]
        dish["match_coverage_pct"] = result["match_coverage_pct"]
        dish["ifct_food_codes"] = result["ifct_food_codes"]
        dish["nutrition_per_100g"] = result["nutrition_per_100g"]
        dish["ingredients"] = [
            {
                "name": row["name"],
                "typical_quantity": row["typical_quantity"],
                "estimated_quantity_g": row["estimated_quantity_g"],
                "ifct_code": row["ifct_code"],
                **({"ifct_name": row["ifct_name"]} if row.get("ifct_name") else {}),
                **({"ifct_match": row["ifct_match"]} if row.get("ifct_match") else {}),
                **(
                    {"ifct_source_note": row["ifct_source_note"]}
                    if row.get("ifct_source_note")
                    else {}
                ),
            }
            for row in result["ingredients"]
        ]
        dish.pop("ifct_components", None)
        dishes.append(result)

    # USDA / non-IFCT dishes in the same seed file: high confidence, no coverage %.
    for dish in seed["dishes"]:
        if dish.get("nutrition_source") != "ifct_2017":
            dish["nutrition_confidence"] = "high"
            dish["match_coverage_pct"] = None

    summary = build_summary(dishes, catalog)
    report = {
        "report_version": 3,
        "title": "IFCT 2017 Indian dish nutrition - full audit",
        "coverage_threshold_pct": COVERAGE_MEDIUM_THRESHOLD,
        "coverage_high_threshold_pct": COVERAGE_HIGH_THRESHOLD,
        "coverage_definition": "matched_mass_g / total_estimated_mass_g * 100",
        "summary": summary,
        "spot_check_dishes": [d for d in dishes if d["class_name"] in SPOT_CHECK],
        "dishes": dishes,
    }

    SEED_PATH.write_text(json.dumps(seed, indent=2) + "\n", encoding="utf-8")
    REPORT_JSON.parent.mkdir(parents=True, exist_ok=True)
    REPORT_JSON.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    write_markdown(report)

    print(f"seed   {SEED_PATH}")
    print(f"json   {REPORT_JSON}")
    print(f"md     {REPORT_MD}")
    print(f"verdict: {summary['verdict']}")
    print(
        f"coverage mean={summary['coverage_mean_pct']}% "
        f"weighted={summary['coverage_mass_weighted_pct']}% "
        f"high={summary['n_high_confidence']} medium={summary['n_medium_confidence']} "
        f"low={summary['n_low_confidence']}"
    )
    for row in summary["coverage_leaderboard"]:
        print(
            f"  {row['class_name']:24} {row['match_coverage_pct']:6.1f}% {row['nutrition_confidence']}"
        )


if __name__ == "__main__":
    main()
