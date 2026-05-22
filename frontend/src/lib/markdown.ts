import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import hljs from "markdown-it-highlightjs";
import katex from "markdown-it-katex";
import taskLists from "markdown-it-task-lists";

export const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
})
  .use(anchor, { permalink: false })
  .use(hljs)
  .use(katex)
  .use(taskLists, { enabled: true, label: true });

export function renderMarkdown(source: string) {
  return markdown.render(source);
}

export interface OutlineItem {
  level: number;
  title: string;
  line: number;
}

export function buildOutline(source: string): OutlineItem[] {
  return source.split(/\r?\n/).flatMap((line, index) => {
    const match = /^(#{1,6})\s+(.+)$/.exec(line);
    if (!match) return [];
    return [{ level: match[1].length, title: match[2].replace(/[#`*_]/g, "").trim(), line: index + 1 }];
  });
}
