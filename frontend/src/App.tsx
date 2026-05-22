import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { Document, Page, pdfjs } from "react-pdf";
import clsx from "clsx";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Braces,
  Code2,
  Columns2,
  Download,
  Eye,
  FileDown,
  FilePlus2,
  FileText,
  Heading1,
  Image,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Maximize2,
  PanelLeft,
  Quote,
  Save,
  Search,
  SplitSquareHorizontal,
  Table2,
  Underline
} from "lucide-react";
import {
  API_BASE,
  type Job,
  type StoredFile,
  convertPdfToDocx,
  exportMarkdown,
  getJob,
  importFiles,
  jobDownloadUrl,
  listFiles,
  rawFileUrl,
  readContent,
  saveContent
} from "./lib/api";
import { buildOutline, renderMarkdown } from "./lib/markdown";
import {
  type ShortcutCommand,
  commandForKey,
  normalizeKey,
  prefixLines,
  replaceSelection,
  shortcutSpecs
} from "./lib/shortcuts";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

type ViewMode = "edit" | "preview" | "split";

const welcome = `# MarkForge

开始编写 Markdown，或导入一个 .md / .pdf 文件。

## 快捷键

- Ctrl+B 加粗
- Ctrl+I 斜体
- Ctrl+Shift+L 无序列表
- Ctrl+Shift+O 有序列表
- Ctrl+T 表格
- F8 专注模式
- F9 打字机模式
`;

function downloadUrl(url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function blobDownload(name: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [activeFile, setActiveFile] = useState<StoredFile | null>(null);
  const [content, setContent] = useState(welcome);
  const [dirty, setDirty] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [editorFocused, setEditorFocused] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState("后端地址 " + API_BASE);
  const [pdfPages, setPdfPages] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const html = useMemo(() => renderMarkdown(content), [content]);
  const outline = useMemo(() => buildOutline(content), [content]);
  const isMarkdown = !activeFile || activeFile.kind === "markdown";
  const isPdf = activeFile?.kind === "pdf";

  const refreshFiles = useCallback(async () => {
    try {
      setFiles(await listFiles());
    } catch (error) {
      setStatus("无法连接后端，请确认 FastAPI 已启动。");
    }
  }, []);

  useEffect(() => {
    void refreshFiles();
  }, [refreshFiles]);

  const openFile = useCallback(async (file: StoredFile) => {
    setActiveFile(file);
    setDirty(false);
    setPdfPage(1);
    if (file.kind === "markdown") {
      setContent(await readContent(file.id));
      setViewMode("split");
    } else {
      setViewMode("preview");
    }
  }, []);

  const importSelectedFiles = useCallback(
    async (selected: FileList | null) => {
      if (!selected?.length) return;
      try {
        const imported = await importFiles(Array.from(selected));
        await refreshFiles();
        if (imported[0]) await openFile(imported[0]);
        setStatus(`已导入 ${imported.length} 个文件`);
      } catch (error) {
        setStatus("导入失败，请检查文件类型或后端状态。");
      }
    },
    [openFile, refreshFiles]
  );

  const saveActive = useCallback(async () => {
    if (!activeFile) {
      blobDownload("untitled.md", content);
      setStatus("已下载未命名 Markdown");
      return;
    }
    if (activeFile.kind !== "markdown") return;
    const saved = await saveContent(activeFile.id, content);
    setActiveFile(saved);
    setFiles((items) => items.map((item) => (item.id === saved.id ? saved : item)));
    setDirty(false);
    setStatus("已保存");
  }, [activeFile, content]);

  const createNew = useCallback(() => {
    setActiveFile(null);
    setContent("# Untitled\n\n");
    setDirty(false);
    setViewMode("split");
    editorRef.current?.focus();
  }, []);

  const startJob = useCallback(
    async (kind: "pdf" | "docx" | "pdf-to-docx") => {
      if (!activeFile) return;
      try {
        const job = kind === "pdf-to-docx" ? await convertPdfToDocx(activeFile.id) : await exportMarkdown(activeFile.id, kind);
        setJobs((items) => [job, ...items]);
        setStatus("任务已创建，正在处理。");
      } catch (error) {
        setStatus("任务创建失败。");
      }
    },
    [activeFile]
  );

  useEffect(() => {
    if (!jobs.some((job) => job.status === "queued" || job.status === "running")) return;
    const timer = window.setInterval(async () => {
      const next = await Promise.all(jobs.map((job) => getJob(job.id)));
      setJobs(next);
      const finished = next.find((job) => job.status === "completed" && !jobs.find((old) => old.id === job.id && old.status === "completed"));
      if (finished) {
        setStatus("任务完成，已开始下载。");
        downloadUrl(jobDownloadUrl(finished.id));
      }
    }, 1200);
    return () => window.clearInterval(timer);
  }, [jobs]);

  const runEditorCommand = useCallback(
    (command: ShortcutCommand) => {
      const instance = editorRef.current;
      if (!instance) return;
      const level = command.startsWith("heading:") ? Number(command.split(":")[1]) : null;
      if (level !== null && Number.isFinite(level)) {
        const prefix = level === 0 ? "" : `${"#".repeat(level)} `;
        const selection = instance.getSelection();
        const model = instance.getModel();
        if (!selection || !model) return;
        const line = selection.startLineNumber;
        const text = model.getLineContent(line).replace(/^#{1,6}\s+/, "");
        instance.executeEdits("heading", [
          {
            range: {
              startLineNumber: line,
              startColumn: 1,
              endLineNumber: line,
              endColumn: model.getLineMaxColumn(line)
            },
            text: `${prefix}${text}`,
            forceMoveMarkers: true
          }
        ]);
        return;
      }

      const actions: Partial<Record<ShortcutCommand, () => void>> = {
        "format:bold": () => replaceSelection(instance, "**"),
        "format:italic": () => replaceSelection(instance, "*"),
        "format:underline": () => replaceSelection(instance, "<u>", "</u>"),
        "format:strike": () => replaceSelection(instance, "~~"),
        "format:inline-code": () => replaceSelection(instance, "`"),
        "format:link": () => replaceSelection(instance, "[", "](https://)", "link"),
        "format:image": () => replaceSelection(instance, "![", "](image.png)", "alt"),
        "format:quote": () => prefixLines(instance, "> "),
        "format:unordered-list": () => prefixLines(instance, "- "),
        "format:ordered-list": () => prefixLines(instance, "1. "),
        "format:task-list": () => prefixLines(instance, "- [ ] "),
        "format:code-block": () => replaceSelection(instance, "```\n", "\n```", "code"),
        "format:inline-math": () => replaceSelection(instance, "$"),
        "format:math-block": () => replaceSelection(instance, "$$\n", "\n$$", "E = mc^2"),
        "format:table": () => replaceSelection(instance, "\n| 列 1 | 列 2 |\n| --- | --- |\n| 内容 | 内容 |\n", "", ""),
        "format:hr": () => replaceSelection(instance, "\n---\n", "", ""),
        "format:align-left": () => replaceSelection(instance, '<p align="left">', "</p>"),
        "format:align-center": () => replaceSelection(instance, '<p align="center">', "</p>"),
        "format:align-right": () => replaceSelection(instance, '<p align="right">', "</p>"),
        "format:align-justify": () => replaceSelection(instance, '<p align="justify">', "</p>")
      };
      actions[command]?.();
    },
    []
  );

  const runCommand = useCallback(
    (command: ShortcutCommand | string) => {
      if (command.startsWith("format:") || command.startsWith("heading:")) {
        runEditorCommand(command as ShortcutCommand);
        return;
      }
      const actions: Record<string, () => void> = {
        "file:new": createNew,
        "file:open": () => inputRef.current?.click(),
        "file:save": () => void saveActive(),
        "file:save-as": () => blobDownload(activeFile?.name ?? "untitled.md", content),
        "file:close": () => setActiveFile(null),
        "view:edit": () => setViewMode("edit"),
        "view:preview": () => setViewMode("preview"),
        "view:split": () => setViewMode("split"),
        "view:source": () => setViewMode("edit"),
        "view:focus": () => setFocusMode((value) => !value),
        "view:typewriter": () => setTypewriterMode((value) => !value),
        "view:outline": () => setOutlineOpen((value) => !value),
        "view:fullscreen": () => void document.documentElement.requestFullscreen?.(),
        "search:find": () => editorRef.current?.getAction("actions.find")?.run(),
        "search:replace": () => editorRef.current?.getAction("editor.action.startFindReplaceAction")?.run(),
        "nav:start": () => editorRef.current?.setPosition({ lineNumber: 1, column: 1 }),
        "nav:end": () => {
          const model = editorRef.current?.getModel();
          if (model) editorRef.current?.setPosition({ lineNumber: model.getLineCount(), column: 1 });
        }
      };
      actions[command]?.();
    },
    [activeFile?.name, content, createNew, runEditorCommand, saveActive]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const command = commandForKey(normalizeKey(event), editorFocused);
      if (!command) return;
      event.preventDefault();
      runCommand(command);
    };
    window.addEventListener("keydown", onKeyDown);
    const remove = typeof window.markforge?.onMenuCommand === "function" ? window.markforge.onMenuCommand(runCommand) : undefined;
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      remove?.();
    };
  }, [editorFocused, runCommand]);

  const onEditorMount: OnMount = (instance) => {
    editorRef.current = instance;
    instance.onDidFocusEditorText(() => setEditorFocused(true));
    instance.onDidBlurEditorText(() => setEditorFocused(false));
  };

  return (
    <div className={clsx("app", focusMode && "focus-mode", typewriterMode && "typewriter-mode")}>
      <input
        ref={inputRef}
        className="hidden-input"
        type="file"
        accept=".md,.markdown,.pdf"
        multiple
        onChange={(event) => void importSelectedFiles(event.target.files)}
      />

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <strong>MarkForge</strong>
            <span>Markdown / PDF</span>
          </div>
        </div>
        <div className="side-actions">
          <button title="新建 Ctrl+N" onClick={createNew}>
            <FilePlus2 size={17} />
          </button>
          <button title="导入 Ctrl+O" onClick={() => inputRef.current?.click()}>
            <FileText size={17} />
          </button>
          <button title="保存 Ctrl+S" onClick={() => void saveActive()} disabled={!isMarkdown}>
            <Save size={17} />
          </button>
        </div>
        <div className="file-list">
          {files.map((file) => (
            <button key={file.id} className={clsx("file-row", activeFile?.id === file.id && "active")} onClick={() => void openFile(file)}>
              <FileText size={16} />
              <span>{file.name}</span>
              <em>{file.kind}</em>
            </button>
          ))}
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="doc-title">
            <strong>{activeFile?.name ?? "Untitled.md"}</strong>
            {dirty && <span>未保存</span>}
          </div>
          <div className="toolbar">
            <button title="编辑" onClick={() => setViewMode("edit")} className={clsx(viewMode === "edit" && "active")}>
              <Code2 size={17} />
            </button>
            <button title="预览" onClick={() => setViewMode("preview")} className={clsx(viewMode === "preview" && "active")}>
              <Eye size={17} />
            </button>
            <button title="分屏" onClick={() => setViewMode("split")} className={clsx(viewMode === "split" && "active")}>
              <SplitSquareHorizontal size={17} />
            </button>
            <button title="大纲" onClick={() => setOutlineOpen((value) => !value)} className={clsx(outlineOpen && "active")}>
              <PanelLeft size={17} />
            </button>
            <button title="专注 F8" onClick={() => setFocusMode((value) => !value)} className={clsx(focusMode && "active")}>
              <Maximize2 size={17} />
            </button>
          </div>
        </header>

        {isMarkdown && (
          <div className="formatbar">
            <button title="加粗 Ctrl+B" onClick={() => runCommand("format:bold")}>
              <Bold size={16} />
            </button>
            <button title="斜体 Ctrl+I" onClick={() => runCommand("format:italic")}>
              <Italic size={16} />
            </button>
            <button title="下划线 Ctrl+U" onClick={() => runCommand("format:underline")}>
              <Underline size={16} />
            </button>
            <button title="标题 Ctrl+1" onClick={() => runCommand("heading:1")}>
              <Heading1 size={16} />
            </button>
            <button title="链接 Ctrl+K" onClick={() => runCommand("format:link")}>
              <Link size={16} />
            </button>
            <button title="图片 Ctrl+Shift+I" onClick={() => runCommand("format:image")}>
              <Image size={16} />
            </button>
            <button title="引用 Ctrl+Shift+Q" onClick={() => runCommand("format:quote")}>
              <Quote size={16} />
            </button>
            <button title="无序列表 Ctrl+Shift+L" onClick={() => runCommand("format:unordered-list")}>
              <List size={16} />
            </button>
            <button title="有序列表 Ctrl+Shift+O" onClick={() => runCommand("format:ordered-list")}>
              <ListOrdered size={16} />
            </button>
            <button title="任务列表 Ctrl+Shift+X" onClick={() => runCommand("format:task-list")}>
              <ListChecks size={16} />
            </button>
            <button title="代码块 Ctrl+Shift+K" onClick={() => runCommand("format:code-block")}>
              <Braces size={16} />
            </button>
            <button title="表格 Ctrl+T" onClick={() => runCommand("format:table")}>
              <Table2 size={16} />
            </button>
            <button title="左对齐" onClick={() => runCommand("format:align-left")}>
              <AlignLeft size={16} />
            </button>
            <button title="居中" onClick={() => runCommand("format:align-center")}>
              <AlignCenter size={16} />
            </button>
            <button title="右对齐" onClick={() => runCommand("format:align-right")}>
              <AlignRight size={16} />
            </button>
            <span className="divider" />
            <button title="导出 PDF" onClick={() => void startJob("pdf")} disabled={!activeFile}>
              <FileDown size={16} />
              PDF
            </button>
            <button title="导出 Word" onClick={() => void startJob("docx")} disabled={!activeFile}>
              <Download size={16} />
              Word
            </button>
          </div>
        )}

        {isPdf && (
          <div className="formatbar">
            <button onClick={() => setPdfPage((page) => Math.max(1, page - 1))}>上一页</button>
            <span className="page-counter">
              {pdfPage} / {pdfPages || "-"}
            </span>
            <button onClick={() => setPdfPage((page) => Math.min(pdfPages || 1, page + 1))}>下一页</button>
            <button onClick={() => setPdfScale((value) => Math.max(0.6, value - 0.1))}>-</button>
            <button onClick={() => setPdfScale((value) => Math.min(2.2, value + 0.1))}>+</button>
            <span className="divider" />
            <button onClick={() => void startJob("pdf-to-docx")}>
              <Download size={16} />
              转 Word
            </button>
          </div>
        )}

        <section className="content-shell">
          {outlineOpen && isMarkdown && (
            <nav className="outline">
              {outline.map((item) => (
                <button
                  key={`${item.line}-${item.title}`}
                  style={{ paddingLeft: 10 + item.level * 8 }}
                  onClick={() => editorRef.current?.revealLineInCenter(item.line)}
                >
                  {item.title}
                </button>
              ))}
            </nav>
          )}

          {isMarkdown && (
            <div className={clsx("editor-grid", viewMode)}>
              {(viewMode === "edit" || viewMode === "split") && (
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  theme="vs"
                  value={content}
                  onMount={onEditorMount}
                  onChange={(value) => {
                    setContent(value ?? "");
                    setDirty(true);
                  }}
                  options={{
                    minimap: { enabled: false },
                    wordWrap: "on",
                    lineNumbers: "on",
                    fontSize: 15,
                    fontFamily: "Cascadia Code, Consolas, monospace",
                    padding: { top: typewriterMode ? 160 : 20, bottom: 80 },
                    scrollBeyondLastLine: true
                  }}
                />
              )}
              {(viewMode === "preview" || viewMode === "split") && (
                <article className="preview" dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </div>
          )}

          {isPdf && activeFile && (
            <div className="pdf-viewer">
              <Document file={rawFileUrl(activeFile.id)} onLoadSuccess={({ numPages }) => setPdfPages(numPages)}>
                <Page pageNumber={pdfPage} scale={pdfScale} />
              </Document>
            </div>
          )}
        </section>

        <footer className="statusbar">
          <span>{status}</span>
          <span>{shortcutSpecs.length} 个快捷键映射</span>
          {jobs[0] && <span>最近任务：{jobs[0].status}</span>}
        </footer>
      </main>
    </div>
  );
}
