from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..config import settings
from ..models import FileKind, StoredFile


MARKDOWN_EXTENSIONS = {".md", ".markdown"}
PDF_EXTENSIONS = {".pdf"}


def ensure_storage() -> None:
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    settings.exports_dir.mkdir(parents=True, exist_ok=True)


def detect_kind(filename: str) -> FileKind:
    suffix = Path(filename).suffix.lower()
    if suffix in MARKDOWN_EXTENSIONS:
        return FileKind.markdown
    if suffix in PDF_EXTENSIONS:
        return FileKind.pdf
    raise HTTPException(status_code=400, detail="Only Markdown and PDF files are supported.")


def mime_for_kind(kind: FileKind) -> str:
    return "application/pdf" if kind == FileKind.pdf else "text/markdown; charset=utf-8"


def import_upload(db: Session, upload: UploadFile) -> StoredFile:
    ensure_storage()
    kind = detect_kind(upload.filename or "untitled")
    suffix = Path(upload.filename or "file").suffix.lower()
    stored_name = f"{uuid.uuid4().hex}{suffix}"
    path = settings.uploads_dir / stored_name

    with path.open("wb") as target:
        shutil.copyfileobj(upload.file, target)

    item = StoredFile(
        name=upload.filename or stored_name,
        kind=kind,
        mime_type=upload.content_type or mime_for_kind(kind),
        path=str(path),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def read_markdown(file: StoredFile) -> str:
    if file.kind != FileKind.markdown:
        raise HTTPException(status_code=400, detail="Only Markdown files have editable text content.")
    return Path(file.path).read_text(encoding="utf-8")


def write_markdown(file: StoredFile, content: str) -> None:
    if file.kind != FileKind.markdown:
        raise HTTPException(status_code=400, detail="Only Markdown files can be saved as text.")
    Path(file.path).write_text(content, encoding="utf-8")
