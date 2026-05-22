# MarkForge

MarkForge 现在是前后端分离结构：

- `frontend/`：React + Vite + Electron 前端，负责 Markdown 编辑/预览、PDF 查看、快捷键和桌面窗口。
- `backend/`：Python FastAPI 后端，负责文件导入、保存、导出、PDF 转 Word、MySQL/Redis。

## 后端启动

```powershell
cd D:\yan\MarkForge
python -m pip install -r backend\requirements.txt
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8765 --reload
```

后端健康检查：

```text
http://127.0.0.1:8765/api/health
```

默认配置见 `backend/.env.example`。默认使用：

- MySQL：`root / 123456`
- Database：`markforge`，启动时自动创建
- Redis：`redis://localhost:6379/0`

## 前端启动

Web 前端：

```powershell
cd D:\yan\MarkForge\frontend
npm install
npm run dev
```

访问：

```text
http://127.0.0.1:5173
```

桌面 Electron 前端：

```powershell
cd D:\yan\MarkForge\frontend
npm run dev:electron
```

前端默认请求后端 `http://127.0.0.1:8765`，可通过 `frontend/.env` 设置：

```text
VITE_API_BASE=http://127.0.0.1:8765
```

## 功能

- Markdown 导入、编辑、编译预览、编辑/预览/分屏模式。
- Typora 风格快捷键映射，编辑区优先 Markdown 格式化命令。
- Markdown 导出 PDF / Word。
- PDF 导入、查看、翻页、缩放。
- PDF 转 Word。
