"""Server-side MediaPipe Pose Landmarker → waist-to-hip and shoulder-to-waist ratios."""

from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

from app.config import settings

# Landmark indices (MediaPipe Pose — same 33-point topology)
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_HIP = 23
RIGHT_HIP = 24
REQUIRED = (LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP)

MIN_LANDMARK_VISIBILITY = 0.55
MIN_MEAN_VISIBILITY = 0.65

FAIL_MESSAGE = (
    "Pose estimation is not confident enough. Stand fully in frame, face the camera, "
    "and use even lighting - then try again."
)

_landmarker = None


@dataclass
class PoseSuccess:
    pose_landmarks_json: dict[str, Any]
    computed_ratios_json: dict[str, Any]


@dataclass
class PoseFailure:
    message: str
    mean_visibility: float | None = None
    required_visibility: dict[str, float] | None = None


def _dist(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def _mid(a: tuple[float, float], b: tuple[float, float]) -> tuple[float, float]:
    return ((a[0] + b[0]) / 2.0, (a[1] + b[1]) / 2.0)


def _model_path() -> Path:
    configured = Path(settings.pose_landmarker_model)
    if configured.is_file():
        return configured
    # Resolve relative to backend/ working directory
    backend_root = Path(__file__).resolve().parents[2]
    candidate = (backend_root / configured).resolve()
    if candidate.is_file():
        return candidate
    raise FileNotFoundError(
        f"Pose landmarker model not found at {configured} (also tried {candidate})"
    )


def _get_landmarker():
    global _landmarker
    if _landmarker is not None:
        return _landmarker
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions, RunningMode

    options = PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(_model_path())),
        running_mode=RunningMode.IMAGE,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    _landmarker = PoseLandmarker.create_from_options(options)
    return _landmarker


def _visibility(lm: Any) -> float:
    if hasattr(lm, "visibility") and lm.visibility is not None:
        return float(lm.visibility)
    if hasattr(lm, "presence") and lm.presence is not None:
        return float(lm.presence)
    return 0.0


def estimate_pose(image_path: str | Path) -> PoseSuccess | PoseFailure:
    """Run MediaPipe Pose on an image path. Never invent ratios on low confidence."""
    path = Path(image_path)
    try:
        with Image.open(path) as img:
            rgb = np.asarray(img.convert("RGB"))
    except Exception:
        return PoseFailure(message=FAIL_MESSAGE)

    if rgb.size == 0:
        return PoseFailure(message=FAIL_MESSAGE)

    try:
        from mediapipe import Image as MpImage
        from mediapipe import ImageFormat
    except ImportError as exc:
        raise RuntimeError("mediapipe is not installed") from exc

    try:
        landmarker = _get_landmarker()
    except FileNotFoundError as exc:
        raise RuntimeError(str(exc)) from exc

    mp_image = MpImage(image_format=ImageFormat.SRGB, data=rgb)
    result = landmarker.detect(mp_image)

    if not result.pose_landmarks:
        return PoseFailure(message=FAIL_MESSAGE)

    landmarks_raw = result.pose_landmarks[0]
    serialized: list[dict[str, Any]] = []
    points: dict[int, tuple[float, float, float]] = {}
    for index, lm in enumerate(landmarks_raw):
        visibility = _visibility(lm)
        serialized.append(
            {
                "index": index,
                "x": float(lm.x),
                "y": float(lm.y),
                "z": float(lm.z),
                "visibility": visibility,
            }
        )
        points[index] = (float(lm.x), float(lm.y), visibility)

    required_visibility = {str(i): points[i][2] for i in REQUIRED if i in points}
    if len(required_visibility) < len(REQUIRED):
        return PoseFailure(message=FAIL_MESSAGE, required_visibility=required_visibility)

    vis_values = [required_visibility[str(i)] for i in REQUIRED]
    mean_visibility = sum(vis_values) / len(vis_values)
    if any(v < MIN_LANDMARK_VISIBILITY for v in vis_values) or mean_visibility < MIN_MEAN_VISIBILITY:
        return PoseFailure(
            message=FAIL_MESSAGE,
            mean_visibility=round(mean_visibility, 4),
            required_visibility={k: round(v, 4) for k, v in required_visibility.items()},
        )

    height, width = rgb.shape[0], rgb.shape[1]

    def px(index: int) -> tuple[float, float]:
        x, y, _ = points[index]
        return (x * width, y * height)

    left_shoulder = px(LEFT_SHOULDER)
    right_shoulder = px(RIGHT_SHOULDER)
    left_hip = px(LEFT_HIP)
    right_hip = px(RIGHT_HIP)

    shoulder_w = _dist(left_shoulder, right_shoulder)
    hip_w = _dist(left_hip, right_hip)
    waist_w = _dist(_mid(left_shoulder, left_hip), _mid(right_shoulder, right_hip))

    if min(shoulder_w, hip_w, waist_w) < 1e-3:
        return PoseFailure(
            message=FAIL_MESSAGE,
            mean_visibility=round(mean_visibility, 4),
            required_visibility={k: round(v, 4) for k, v in required_visibility.items()},
        )

    waist_to_hip = waist_w / hip_w
    shoulder_to_waist = shoulder_w / waist_w

    return PoseSuccess(
        pose_landmarks_json={
            "status": "ok",
            "mean_visibility": round(mean_visibility, 4),
            "required_visibility": {k: round(v, 4) for k, v in required_visibility.items()},
            "landmarks": serialized,
        },
        computed_ratios_json={
            "waist_to_hip": round(waist_to_hip, 4),
            "shoulder_to_waist": round(shoulder_to_waist, 4),
            "pixel_widths": {
                "shoulder": round(shoulder_w, 2),
                "waist": round(waist_w, 2),
                "hip": round(hip_w, 2),
            },
        },
    )
