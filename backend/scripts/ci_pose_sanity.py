"""CI helper: prove the pose model + progress fixture work before smokes."""

from __future__ import annotations

import sys
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.pose import PoseSuccess, _model_path, estimate_pose  # noqa: E402


def main() -> None:
    try:
        model = _model_path()
        print("model_path", model, "bytes", model.stat().st_size)
        img = (
            Path(__file__).resolve().parent
            / "fixtures"
            / "progress"
            / "good_standing.jpg"
        )
        print("fixture", img, "bytes", img.stat().st_size if img.is_file() else "MISSING")
        result = estimate_pose(img)
        print(
            type(result).__name__,
            getattr(result, "message", None),
            getattr(result, "mean_visibility", None),
            getattr(result, "required_visibility", None),
            getattr(result, "computed_ratios_json", None),
        )
        if not isinstance(result, PoseSuccess):
            print(f"::error::pose fixture failed: {result}")
            raise SystemExit(1)
        print("POSE_SANITY_OK")
    except SystemExit:
        raise
    except Exception as exc:  # noqa: BLE001 — CI must surface the real stack
        traceback.print_exc()
        print(f"::error::pose sanity exception: {exc}")
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
