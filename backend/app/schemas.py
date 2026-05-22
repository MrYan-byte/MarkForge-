from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from .models import FileKind, JobStatus


class FileOut(BaseModel):
    id: int
    name: str
    kind: FileKind
    mime_type: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ContentIn(BaseModel):
    content: str


class ExportIn(BaseModel):
    format: str


class JobOut(BaseModel):
    id: int
    file_id: int
    kind: str
    status: JobStatus
    output_path: str | None = None
    error: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
