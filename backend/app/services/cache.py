from __future__ import annotations

import json

import redis

from ..config import settings
from ..models import Job


try:
    redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
    redis_client.ping()
except Exception:
    redis_client = None


def mirror_job(job: Job) -> None:
    if not redis_client:
        return
    redis_client.setex(
        f"markforge:job:{job.id}",
        60 * 60,
        json.dumps(
            {
                "id": job.id,
                "file_id": job.file_id,
                "kind": job.kind,
                "status": job.status.value,
                "output_path": job.output_path,
                "error": job.error,
            },
            ensure_ascii=False,
        ),
    )
