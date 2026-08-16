"""Parse IFCT 2017 proximate table text into a local food catalog JSON."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TXT = ROOT / "ml" / "data" / "raw" / "IFCT2017.txt"
OUT = ROOT / "ml" / "data" / "raw" / "ifct2017_proximate.json"


def parse_catalog(text: str) -> dict[str, dict]:
    text = text.replace("\u00b1", "±").replace("\ufffd", "±")
    lines = [ln.strip() for ln in text.splitlines()]
    entries: dict[str, dict] = {}
    i = 0
    while i < len(lines):
        if not re.fullmatch(r"[A-Z]\d{3}", lines[i]):
            i += 1
            continue
        code = lines[i]
        j = i + 1
        name_parts: list[str] = []
        while j < len(lines) and not re.fullmatch(r"\d+", lines[j]):
            if re.fullmatch(r"[A-Z]\d{3}", lines[j]):
                break
            if lines[j] and not lines[j].startswith("====="):
                name_parts.append(lines[j])
            j += 1
            if j - i > 8:
                break
        if j >= len(lines) or not re.fullmatch(r"\d+", lines[j]):
            i += 1
            continue
        j += 1  # skip n_regions
        nums: list[float] = []
        while j < len(lines) and len(nums) < 12:
            cleaned = lines[j].replace(" ", "")
            nm = re.match(r"^(\d+(?:\.\d+)?)(?:±\d+(?:\.\d+)?)?$", cleaned)
            if nm:
                nums.append(float(nm.group(1)))
                j += 1
                continue
            parts = re.findall(r"(\d+(?:\.\d+)?)(?:±\d+(?:\.\d+)?)?", lines[j])
            if parts and len(parts) <= 3 and not re.search(r"[A-Za-z]", lines[j]):
                nums.extend(float(p) for p in parts)
                j += 1
                continue
            break
        name = re.sub(r"\s+", " ", " ".join(name_parts)).strip()
        if len(nums) < 5 or not name:
            i = j if j > i else i + 1
            continue
        if len(nums) >= 9:
            moisture, protein, ash, fat = nums[0], nums[1], nums[2], nums[3]
            carbs = nums[7]
            energy_kj = nums[8]
        elif len(nums) == 6:
            moisture, protein, ash, fat, carbs, energy_kj = nums
        elif len(nums) == 5:
            moisture, protein, ash, fat, energy_kj = nums
            kcal_tmp = energy_kj / 4.184
            carbs = max(0.0, (kcal_tmp - protein * 4 - fat * 9) / 4)
        else:
            i = j if j > i else i + 1
            continue
        # Keep first proximate hit for each code (later tables are vitamins/minerals).
        if code not in entries:
            entries[code] = {
                "code": code,
                "name": name,
                "moisture": round(moisture, 2),
                "protein": round(protein, 2),
                "ash": round(ash, 2),
                "fat": round(fat, 2),
                "carbs": round(carbs, 2),
                "energy_kj": energy_kj,
                "calories": round(energy_kj / 4.184, 1),
            }
        i = j if j > i else i + 1
    return entries


def main() -> None:
    catalog = parse_catalog(TXT.read_text(encoding="utf-8", errors="replace"))
    OUT.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    print(f"parsed {len(catalog)} foods -> {OUT}")
    needles = (
        "rice",
        "flake",
        "wheat",
        "paneer",
        "chicken",
        "ghee",
        "butter",
        "cream",
        "onion",
        "tomato",
        "ginger",
        "spinach",
        "cauliflower",
        "potato",
        "bengal",
        "black gram",
        "pigeon",
        "green gram",
        "moong",
        "cashew",
        "curd",
        "milk",
        "honey",
        "garlic",
        "capsicum",
        "lemon",
        "sugar",
        "kidney",
        "chilli",
        "chili",
        "turmeric",
        "cardamom",
        "fennel",
        "saffron",
        "yoghurt",
        "yogurt",
        "oil",
        "corn",
        "palak",
        "chickpea",
        "urad",
        "rava",
        "semolina",
        "methi",
        "fenugreek",
        "rose",
        "cottage",
        "rajma",
        "avocado",
        "star anise",
        "anise",
        "baking",
        "vinegar",
        "dough",
        "maize",
        "safflower",
        "mustard",
        "sunflower",
        "groundnut",
        "peanut",
        "coconut",
        "cumin",
        "coriander",
        "clove",
        "pepper",
        "bay",
    )
    for code, entry in sorted(catalog.items()):
        low = entry["name"].lower()
        if any(n in low for n in needles):
            print(
                f"{code}\t{entry['calories']}\tP{entry['protein']}\t"
                f"C{entry['carbs']}\tF{entry['fat']}\t{entry['name'][:90]}"
            )


if __name__ == "__main__":
    main()
