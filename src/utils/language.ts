import type { Extension } from '@codemirror/state';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import type { EditorLanguage } from '../types/workspace';

export function detectLanguageFromPath(path: string): EditorLanguage {
  const lower = path.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.svg')) return 'html';
  if (lower.endsWith('.css')) return 'css';
  if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.jsx')) return 'javascript';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
  if (lower.endsWith('.py')) return 'python';
  return 'plaintext';
}

export function getLanguageLabel(lang: EditorLanguage): string {
  switch (lang) {
    case 'html':
      return 'HTML';
    case 'css':
      return 'CSS';
    case 'javascript':
      return 'JavaScript';
    case 'typescript':
      return 'TypeScript';
    case 'json':
      return 'JSON';
    case 'markdown':
      return 'Markdown';
    case 'python':
      return 'Python';
    default:
      return 'Plain Text';
  }
}

export function getLanguageExtension(lang: EditorLanguage): Extension[] {
  switch (lang) {
    case 'html':
      return [html()];
    case 'css':
      return [css()];
    case 'javascript':
      return [javascript({ jsx: true })];
    case 'typescript':
      return [javascript({ jsx: true, typescript: true })];
    case 'json':
      return [json()];
    case 'markdown':
      return [markdown()];
    case 'python':
      return [python()];
    default:
      return [];
  }
}

export function getFileBadgeColor(lang: EditorLanguage): string {
  switch (lang) {
    case 'html':
      return 'text-orange-500 dark:text-orange-400';
    case 'css':
      return 'text-sky-500 dark:text-sky-400';
    case 'javascript':
      return 'text-amber-500 dark:text-amber-400';
    case 'typescript':
      return 'text-blue-500 dark:text-blue-400';
    case 'json':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'markdown':
      return 'text-slate-600 dark:text-slate-300';
    case 'python':
      return 'text-indigo-500 dark:text-indigo-400';
    default:
      return 'text-slate-400 dark:text-slate-500';
  }
}

export function getFileShortTag(path: string): string {
  const lang = detectLanguageFromPath(path);
  switch (lang) {
    case 'html':
      return '<>';
    case 'css':
      return '#';
    case 'javascript':
      return 'JS';
    case 'typescript':
      return 'TS';
    case 'json':
      return '{}';
    case 'markdown':
      return 'MD';
    case 'python':
      return 'PY';
    default:
      return 'TX';
  }
}

export function formatCode(content: string, lang: EditorLanguage): string {
  if (lang === 'json') {
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2) + '\n';
  }

  if (lang === 'html') {
    return formatHtmlBasic(content);
  }

  if (lang === 'css') {
    return formatCssBasic(content);
  }

  if (lang === 'javascript' || lang === 'typescript') {
    return formatBraceIndentation(content);
  }

  return content.replace(/[ \t]+$/gm, '');
}

function formatBraceIndentation(source: string): string {
  const lines = source.split('\n');
  let indent = 0;
  const out: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      out.push('');
      continue;
    }
    const startsWithClose = /^[}\])]/.test(line);
    if (startsWithClose && indent > 0) {
      indent--;
    }
    out.push('  '.repeat(indent) + line);

    const opens = (line.match(/[{([]/g) || []).length;
    const closes = (line.match(/[})\]]/g) || []).length;
    const delta = opens - closes + (startsWithClose ? 1 : 0);
    indent = Math.max(0, indent + delta);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function formatCssBasic(source: string): string {
  const normalized = source
    .replace(/\s*{\s*/g, ' {\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\s*}\s*/g, '\n}\n\n');
  return formatBraceIndentation(normalized);
}

function formatHtmlBasic(source: string): string {
  const voidTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype',
  ]);
  const tokens = source
    .replace(/>\s+</g, '>\n<')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let indent = 0;
  const out: string[] = [];

  for (const line of tokens) {
    const isClosing = /^<\/[a-zA-Z0-9-]+>/.test(line);
    if (isClosing && indent > 0) {
      indent--;
    }
    out.push('  '.repeat(indent) + line);

    const openMatch = line.match(/^<([a-zA-Z0-9!-]+)/);
    const hasInlineClose = /<\/[a-zA-Z0-9-]+>\s*$/.test(line) || /\/>\s*$/.test(line);
    if (openMatch && !isClosing && !hasInlineClose) {
      const tag = openMatch[1].toLowerCase();
      if (!voidTags.has(tag) && !line.startsWith('<!--')) {
        indent++;
      }
    }
  }

  return out.join('\n') + '\n';
}
