"""Local-disk media storage for user-uploaded files (avatars). Fine for the
current single-instance dev deployment; swap for object storage (S3-compatible)
before scaling beyond one backend process or one disk.
"""

from pathlib import Path

MEDIA_ROOT = Path(__file__).resolve().parent.parent.parent / "media"
AVATAR_DIR = MEDIA_ROOT / "avatars"
AVATAR_DIR.mkdir(parents=True, exist_ok=True)
