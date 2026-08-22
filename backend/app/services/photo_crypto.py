"""Fernet encryption for photos at rest under object storage."""

from __future__ import annotations

from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings

# JPEG SOI / PNG signature — legacy plaintext files written before encryption.
_JPEG_MAGIC = b"\xff\xd8\xff"
_PNG_MAGIC = b"\x89PNG\r\n\x1a\n"


def _fernet() -> Fernet:
    key = (settings.photo_encryption_key or "").strip()
    if not key:
        raise RuntimeError(
            "PHOTO_ENCRYPTION_KEY is not set. Generate one with: "
            'python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"'
        )
    return Fernet(key.encode("ascii") if isinstance(key, str) else key)


def looks_like_image(data: bytes) -> bool:
    return data.startswith(_JPEG_MAGIC) or data.startswith(_PNG_MAGIC)


def encrypt_bytes(plaintext: bytes) -> bytes:
    return _fernet().encrypt(plaintext)


def decrypt_bytes(blob: bytes) -> bytes:
    if looks_like_image(blob):
        # Legacy plaintext on disk — return as-is (no migration).
        return blob
    try:
        return _fernet().decrypt(blob)
    except InvalidToken as exc:
        raise ValueError("Photo could not be decrypted") from exc


def write_encrypted(path: Path | str, plaintext: bytes) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(encrypt_bytes(plaintext))


def read_decrypted(path: Path | str) -> bytes:
    return decrypt_bytes(Path(path).read_bytes())
