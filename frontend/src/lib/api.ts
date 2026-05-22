import axios from "axios";

export type FileKind = "markdown" | "pdf";
export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface StoredFile {
  id: number;
  name: string;
  kind: FileKind;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  file_id: number;
  kind: string;
  status: JobStatus;
  output_path?: string | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
}

export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8765";

const client = axios.create({
  baseURL: API_BASE
});

export async function listFiles() {
  const { data } = await client.get<StoredFile[]>("/api/files");
  return data;
}

export async function importFiles(files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  const { data } = await client.post<StoredFile[]>("/api/files/import", form);
  return data;
}

export async function readContent(id: number) {
  const { data } = await client.get<string>(`/api/files/${id}/content`, { responseType: "text" });
  return data;
}

export async function saveContent(id: number, content: string) {
  const { data } = await client.put<StoredFile>(`/api/files/${id}/content`, { content });
  return data;
}

export async function exportMarkdown(id: number, format: "pdf" | "docx") {
  const { data } = await client.post<Job>(`/api/files/${id}/export`, { format });
  return data;
}

export async function convertPdfToDocx(id: number) {
  const { data } = await client.post<Job>(`/api/files/${id}/convert/pdf-to-docx`);
  return data;
}

export async function getJob(id: number) {
  const { data } = await client.get<Job>(`/api/jobs/${id}`);
  return data;
}

export function rawFileUrl(id: number) {
  return `${API_BASE}/api/files/${id}/raw`;
}

export function jobDownloadUrl(id: number) {
  return `${API_BASE}/api/jobs/${id}/download`;
}
