# Module 4: MediaPipe Pose landmarks → relative ratios and silhouette comparison.
#
# Core constraint: never compute or display a body-fat percentage or any clinical claim.
# Store pose_landmarks_json and computed_ratios_json (waist-to-hip, shoulder-to-waist).

def extract_pose_landmarks(_image_path: str) -> dict:
    """Return MediaPipe landmark payload. Implemented in Progress Intelligence."""
    raise NotImplementedError("Pose estimation is not part of Module 1 scaffold.")


def compute_ratios(_landmarks: dict) -> dict:
    """Return waist-to-hip and related ratios. Never returns body-fat percentage."""
    raise NotImplementedError("Ratio computation is not part of Module 1 scaffold.")
