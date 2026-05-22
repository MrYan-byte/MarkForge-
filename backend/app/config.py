from __future__ import annotations

import os
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings:
    database_url: str = os.getenv(
        "MARKFORGE_DATABASE_URL",
        "mysql+pymysql://root:123456@localhost:3306/markforge",
    )
    redis_url: str = os.getenv("MARKFORGE_REDIS_URL", "redis://localhost:6379/0")
    storage_dir: Path = Path(os.getenv("MARKFORGE_STORAGE_DIR", BACKEND_DIR / "storage"))
    api_origin: str = os.getenv("MARKFORGE_API_ORIGIN", "http://127.0.0.1:5173")

    @property
    def uploads_dir(self) -> Path:
        return self.storage_dir / "uploads"

    @property
    def exports_dir(self) -> Path:
        return self.storage_dir / "exports"


settings = Settings()
