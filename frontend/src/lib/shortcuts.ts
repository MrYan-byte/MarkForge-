import type { editor } from "monaco-editor";

export type ShortcutCommand =
  | "file:new"
  | "file:open"
  | "file:save"
  | "file:save-as"
  | "file:close"
  | "file:recent"
  | "file:quit"
  | "format:bold"
  | "format:italic"
  | "format:underline"
  | "format:strike"
  | "format:inline-code"
  | "format:link"
  | "format:image"
  | "format:quote"
  | "format:unordered-list"
  | "format:ordered-list"
  | "format:task-list"
  | "format:code-block"
  | "format:inline-math"
  | "format:math-block"
  | "format:table"
  | "format:hr"
  | "format:align-left"
  | "format:align-center"
  | "format:align-right"
  | "format:align-justify"
  | "heading:0"
  | "heading:1"
  | "heading:2"
  | "heading:3"
  | "heading:4"
  | "heading:5"
  | "heading:6"
  | "view:edit"
  | "view:preview"
  | "view:split"
  | "view:source"
  | "view:focus"
  | "view:typewriter"
  | "view:outline"
  | "view:fullscreen"
  | "search:find"
  | "search:replace"
  | "nav:start"
  | "nav:end";

export interface ShortcutSpec {
  command: ShortcutCommand;
  keys: string[];
  label: string;
  scope: "global" | "editor";
}

export const shortcutSpecs: ShortcutSpec[] = [
  { command: "file:new", keys: ["Ctrl+N", "Cmd+N"], label: "新建文件", scope: "global" },
  { command: "file:open", keys: ["Ctrl+O", "Cmd+O"], label: "打开/导入文件", scope: "global" },
  { command: "file:save", keys: ["Ctrl+S", "Cmd+S"], label: "保存", scope: "global" },
  { command: "file:save-as", keys: ["Ctrl+Shift+S", "Cmd+Shift+S"], label: "另存为", scope: "global" },
  { command: "file:close", keys: ["Ctrl+W", "Cmd+W"], label: "关闭文档", scope: "global" },
  { command: "file:recent", keys: ["Ctrl+Shift+O", "Cmd+Shift+O"], label: "最近文件", scope: "global" },
  { command: "format:bold", keys: ["Ctrl+B", "Cmd+B"], label: "加粗", scope: "editor" },
  { command: "format:italic", keys: ["Ctrl+I", "Cmd+I"], label: "斜体", scope: "editor" },
  { command: "format:underline", keys: ["Ctrl+U", "Cmd+U"], label: "下划线", scope: "editor" },
  { command: "format:strike", keys: ["Alt+Shift+5"], label: "删除线", scope: "editor" },
  { command: "format:inline-code", keys: ["Ctrl+Shift+`", "Cmd+Shift+`"], label: "行内代码", scope: "editor" },
  { command: "format:link", keys: ["Ctrl+K", "Cmd+K"], label: "插入链接", scope: "editor" },
  { command: "format:image", keys: ["Ctrl+Shift+I", "Cmd+Shift+I"], label: "插入图片", scope: "editor" },
  { command: "format:quote", keys: ["Ctrl+Shift+Q", "Cmd+Shift+Q"], label: "块引用", scope: "editor" },
  { command: "format:unordered-list", keys: ["Ctrl+Shift+L", "Cmd+Shift+L"], label: "无序列表", scope: "editor" },
  { command: "format:ordered-list", keys: ["Ctrl+Shift+O", "Cmd+Shift+O"], label: "有序列表", scope: "editor" },
  { command: "format:task-list", keys: ["Ctrl+Shift+X", "Cmd+Shift+X"], label: "任务列表", scope: "editor" },
  { command: "format:code-block", keys: ["Ctrl+Shift+K", "Cmd+Shift+K"], label: "代码块", scope: "editor" },
  { command: "format:inline-math", keys: ["Ctrl+M", "Cmd+M"], label: "行内公式", scope: "editor" },
  { command: "format:math-block", keys: ["Ctrl+Shift+M", "Cmd+Shift+M"], label: "公式块", scope: "editor" },
  { command: "format:table", keys: ["Ctrl+T", "Cmd+T"], label: "插入表格", scope: "editor" },
  { command: "format:hr", keys: ["Ctrl+Shift+-", "Cmd+Shift+-"], label: "水平分割线", scope: "editor" },
  { command: "format:align-left", keys: ["Ctrl+Alt+L", "Cmd+Alt+L"], label: "左对齐", scope: "editor" },
  { command: "format:align-center", keys: ["Ctrl+Shift+E", "Cmd+Shift+E"], label: "居中对齐", scope: "editor" },
  { command: "format:align-right", keys: ["Ctrl+Shift+R", "Cmd+Shift+R"], label: "右对齐", scope: "editor" },
  { command: "format:align-justify", keys: ["Ctrl+Shift+J", "Cmd+Shift+J"], label: "两端对齐", scope: "editor" },
  ...([0, 1, 2, 3, 4, 5, 6] as const).map((level) => ({
    command: `heading:${level}` as ShortcutCommand,
    keys: [`Ctrl+${level}`, `Cmd+${level}`],
    label: level === 0 ? "正文段落" : `${level} 级标题`,
    scope: "editor" as const
  })),
  { command: "view:edit", keys: ["Ctrl+Shift+7", "Cmd+Shift+7"], label: "编辑视图", scope: "global" },
  { command: "view:preview", keys: ["Ctrl+Shift+8", "Cmd+Shift+8"], label: "预览视图", scope: "global" },
  { command: "view:split", keys: ["Ctrl+Shift+9", "Cmd+Shift+9"], label: "分屏视图", scope: "global" },
  { command: "view:source", keys: ["Ctrl+/", "Cmd+/"], label: "源码模式", scope: "global" },
  { command: "view:focus", keys: ["F8"], label: "专注模式", scope: "global" },
  { command: "view:typewriter", keys: ["F9"], label: "打字机模式", scope: "global" },
  { command: "view:outline", keys: ["Ctrl+Shift+1", "Cmd+Shift+1"], label: "大纲", scope: "global" },
  { command: "view:fullscreen", keys: ["F11"], label: "全屏", scope: "global" },
  { command: "search:find", keys: ["Ctrl+F", "Cmd+F"], label: "查找", scope: "global" },
  { command: "search:replace", keys: ["Ctrl+H", "Cmd+Alt+F"], label: "替换", scope: "global" },
  { command: "nav:start", keys: ["Ctrl+Home", "Cmd+Up"], label: "跳到开头", scope: "global" },
  { command: "nav:end", keys: ["Ctrl+End", "Cmd+Down"], label: "跳到结尾", scope: "global" }
];

export function normalizeKey(event: KeyboardEvent | React.KeyboardEvent) {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.metaKey) parts.push("Cmd");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");

  const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  parts.push(key === " " ? "Space" : key);
  return parts.join("+");
}

export function commandForKey(key: string, editorFocused: boolean): ShortcutCommand | null {
  const matches = shortcutSpecs.filter((item) => item.keys.includes(key));
  const editorMatch = matches.find((item) => item.scope === "editor");
  const globalMatch = matches.find((item) => item.scope === "global");
  return (editorFocused ? editorMatch ?? globalMatch : globalMatch ?? editorMatch)?.command ?? null;
}

export function replaceSelection(editorInstance: editor.IStandaloneCodeEditor, before: string, after = before, placeholder = "text") {
  const selection = editorInstance.getSelection();
  if (!selection) return;
  const model = editorInstance.getModel();
  if (!model) return;
  const text = model.getValueInRange(selection) || placeholder;
  editorInstance.executeEdits("shortcut", [
    {
      range: selection,
      text: `${before}${text}${after}`,
      forceMoveMarkers: true
    }
  ]);
  editorInstance.focus();
}

export function prefixLines(editorInstance: editor.IStandaloneCodeEditor, prefix: string) {
  const selection = editorInstance.getSelection();
  const model = editorInstance.getModel();
  if (!selection || !model) return;
  const start = selection.startLineNumber;
  const end = selection.endLineNumber;
  const edits = [];
  for (let line = start; line <= end; line += 1) {
    edits.push({
      range: {
        startLineNumber: line,
        startColumn: 1,
        endLineNumber: line,
        endColumn: 1
      },
      text: prefix,
      forceMoveMarkers: true
    });
  }
  editorInstance.executeEdits("shortcut", edits);
  editorInstance.focus();
}
