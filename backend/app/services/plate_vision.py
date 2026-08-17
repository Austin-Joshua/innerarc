"""Gemini Vision multi-item plate recognition — names + portions only, no nutrition."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

from app.config import settings

Portion = Literal["small", "medium", "large"]

PORTION_FACTORS: dict[str, float] = {
    "small": 0.6,
    "medium": 1.0,
    "large": 1.4,
}

SYSTEM_INSTRUCTION = """You identify distinct food items visible on a meal plate photo.

Hard rules:
1. Return JSON only matching the schema. No prose.
2. List each distinct edible item you can see (e.g. rice, a curry, bread, salad).
3. For each item give an approximate portion size: small, medium, or large.
4. Do NOT invent calories, macros, ingredients, recipes, or nutrition values.
5. Prefer common dish names when clear; otherwise use a short descriptive food label.
6. Do not invent items that are not visible.
"""

RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "label": {"type": "string"},
                    "portion": {"type": "string", "enum": ["small", "medium", "large"]},
                    "confidence": {"type": "number"},
                },
                "required": ["label", "portion"],
            },
        }
    },
    "required": ["items"],
}


@dataclass(frozen=True)
class VisionItem:
    label: str
    portion: Portion
    confidence: float | None


def normalize_label(value: str) -> str:
    text = value.casefold().strip()
    text = text.replace("_", " ").replace("-", " ")
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text)
    if text.endswith("es") and len(text) > 4:
        text = text[:-2]
    elif text.endswith("s") and len(text) > 3 and not text.endswith("ss"):
        text = text[:-1]
    return text


def _mime_for_path(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".png"}:
        return "image/png"
    if suffix in {".webp"}:
        return "image/webp"
    if suffix in {".gif"}:
        return "image/gif"
    return "image/jpeg"


def _coerce_portion(raw: Any) -> Portion:
    value = str(raw or "medium").casefold().strip()
    if value in PORTION_FACTORS:
        return value  # type: ignore[return-value]
    return "medium"


def parse_vision_payload(payload: dict[str, Any] | list[Any]) -> list[VisionItem]:
    if isinstance(payload, list):
        raw_items = payload
    else:
        raw_items = payload.get("items") or []
    if not isinstance(raw_items, list):
        raise ValueError("Gemini plate response missing items array")

    items: list[VisionItem] = []
    for entry in raw_items:
        if not isinstance(entry, dict):
            continue
        label = str(entry.get("label") or "").strip()
        if not label:
            continue
        conf_raw = entry.get("confidence")
        confidence: float | None
        try:
            confidence = float(conf_raw) if conf_raw is not None else None
            if confidence is not None:
                confidence = max(0.0, min(1.0, confidence))
        except (TypeError, ValueError):
            confidence = None
        items.append(
            VisionItem(
                label=label,
                portion=_coerce_portion(entry.get("portion")),
                confidence=confidence,
            )
        )
    return items


def identify_plate_items(image_path: str, catalog_names: list[str]) -> list[VisionItem]:
    """Call Gemini Vision; return structured items (labels + portions only)."""
    api_key = (settings.gemini_api_key or "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    path = Path(image_path)
    if not path.is_file():
        raise FileNotFoundError(f"Plate image not found: {image_path}")

    import time

    from google import genai
    from google.genai import types

    catalog = ", ".join(sorted(set(catalog_names)))
    prompt = (
        "List every distinct food item visible on this plate. "
        "Prefer labels from this curated dish catalog when they clearly match: "
        f"{catalog}. "
        "If an item is not in the catalog, still include it with a short descriptive label. "
        "Return JSON with key items: [{label, portion, confidence}]."
    )

    client = genai.Client(api_key=api_key)
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=[
                    types.Part.from_bytes(data=path.read_bytes(), mime_type=_mime_for_path(path)),
                    prompt,
                ],
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.2,
                    max_output_tokens=4096,
                    response_mime_type="application/json",
                    response_schema=RESPONSE_SCHEMA,
                ),
            )
            text = (response.text or "").strip()
            if not text:
                raise RuntimeError("Gemini returned an empty plate response")
            try:
                payload = json.loads(text)
            except json.JSONDecodeError as exc:
                raise RuntimeError(f"Gemini plate response was not valid JSON: {text[:200]}") from exc
            return parse_vision_payload(payload)
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            msg = str(exc).lower()
            if attempt < 2 and ("503" in msg or "unavailable" in msg or "high demand" in msg):
                time.sleep(2 * (attempt + 1))
                continue
            raise
    raise RuntimeError(f"Plate vision failed after retries: {last_error}")


def serving_from_portion(default_serving_g: float | int, portion: Portion) -> float:
    return round(float(default_serving_g) * PORTION_FACTORS[portion], 1)
