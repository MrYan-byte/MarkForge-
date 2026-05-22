from __future__ import annotations

from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db, init_database
from .models import FileKind, Job, StoredFile
from .schemas import ContentIn, ExportIn, FileOut, JobOut
from .services.conversions import create_job, run_job
from .services.storage import import_upload, read_markdown, write_markdown


app = FastAPI(title="MarkForge API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.api_origin, "http://127.0.0.1:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_database()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/files/import", response_model=list[FileOut])
def import_files(files: list[UploadFile] = File(...), db: Session = Depends(get_db)) -> list[StoredFile]:
    return [import_upload(db, item) for item in files]


@app.get("/api/files", response_model=list[FileOut])
def list_files(db: Session = Depends(get_db)) -> list[StoredFile]:
    return db.query(StoredFile).order_by(StoredFile.updated_at.desc()).all()


@app.get("/api/files/{file_id}", response_model=FileOut)
def get_file(file_id: int, db: Session = Depends(get_db)) -> StoredFile:
    item = db.get(StoredFile, file_id)
    if not item:
        raise HTTPException(status_code=404, detail="File not found.")
    return item


@app.get("/api/files/{file_id}/content", response_class=PlainTextResponse)
def get_content(file_id: int, db: Session = Depends(get_db)) -> str:
    item = db.get(StoredFile, file_id)
    if not item:
        raise HTTPException(status_code=404, detail="File not found.")
    return read_markdown(item)


@app.put("/api/files/{file_id}/content", response_model=FileOut)
def update_content(file_id: int, payload: ContentIn, db: Session = Depends(get_db)) -> StoredFile:
    item = db.get(StoredFile, file_id)
    if not item:
        raise HTTPException(status_code=404, detail="File not found.")
    write_markdown(item, payload.content)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.get("/api/files/{file_id}/raw")
def raw_file(file_id: int, db: Session = Depends(get_db)) -> FileResponse:
    item = db.get(StoredFile, file_id)
    if not item:
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(item.path, media_type=item.mime_type, filename=item.name)


@app.post("/api/files/{file_id}/export", response_model=JobOut)
def export_markdown(file_id: int, payload: ExportIn, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> Job:
    item = db.get(StoredFile, file_id)
    if not item:
        raise HTTPException(status_code=404, detail="File not found.")
    if item.kind != FileKind.markdown:
        raise HTTPException(status_code=400, detail="Only Markdown files can be exported.")
    if payload.format not in {"pdf", "docx"}:
        raise HTTPException(status_code=400, detail="Export format must be pdf or docx.")

    job = create_job(db, file_id, f"markdown-to-{payload.format}")
    background_tasks.add_task(run_job, job.id)
    return job


@app.post("/api/files/{file_id}/convert/pdf-to-docx", response_model=JobOut)
def convert_pdf(file_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> Job:
    item = db.get(StoredFile, file_id)
    if not item:
        raise HTTPException(status_code=404, detail="File not found.")
    if item.kind != FileKind.pdf:
        raise HTTPException(status_code=400, detail="Only PDF files can be converted to Word.")

    job = create_job(db, file_id, "pdf-to-docx")
    background_tasks.add_task(run_job, job.id)
    return job


@app.get("/api/jobs/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)) -> Job:
    item = db.get(Job, job_id)
    if not item:
        raise HTTPException(status_code=404, detail="Job not found.")
    return item


@app.get("/api/jobs/{job_id}/download")
def download_job(job_id: int, db: Session = Depends(get_db)) -> FileResponse:
    item = db.get(Job, job_id)
    if not item or not item.output_path:
        raise HTTPException(status_code=404, detail="Output file not found.")
    path = Path(item.output_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Output file is missing on disk.")
    return FileResponse(path, filename=path.name)
