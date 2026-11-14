import JSZip from 'jszip';
import type { CodeFile, CodeProject } from '../types/workspace';

const CONSOLE_BRIDGE_SCRIPT = `
<script>
(function() {
  if (window.__kodoBridgeInstalled) return;
  window.__kodoBridgeInstalled = true;

  function formatArg(val, depth) {
    if (depth === undefined) depth = 0;
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') return String(val);
    if (typeof val === 'function') return '[Function: ' + (val.name || 'anonymous') + ']';
    if (val instanceof Error) return val.name + ': ' + val.message;
    if (depth > 2) return Array.isArray(val) ? '[Array]' : '[Object]';
    try {
      return JSON.stringify(val, function(k, v) {
        if (typeof v === 'function') return '[Function]';
        if (v instanceof HTMLElement) return '<' + v.tagName.toLowerCase() + '>';
        return v;
      }, 2);
    } catch (e) {
      return String(val);
    }
  }

  function send(level, args) {
    try {
      var formatted = Array.prototype.slice.call(args).map(function(a) { return formatArg(a, 0); });
      window.parent.postMessage({
        source: 'kodo-preview',
        type: 'console',
        level: level,
        messages: formatted
      }, '*');
    } catch (err) {}
  }

  ['log', 'info', 'warn', 'error'].forEach(function(level) {
    var orig = console[level];
    console[level] = function() {
      send(level, arguments);
      if (orig) orig.apply(console, arguments);
    };
  });

  var origClear = console.clear;
  console.clear = function() {
    window.parent.postMessage({ source: 'kodo-preview', type: 'clear' }, '*');
    if (origClear) origClear.apply(console);
  };

  window.addEventListener('error', function(event) {
    var location = event.lineno ? ' (line ' + event.lineno + ')' : '';
    send('error', [event.message + location]);
  });

  window.addEventListener('unhandledrejection', function(event) {
    send('error', ['Unhandled Promise Rejection:', event.reason]);
  });

  window.addEventListener('message', function(event) {
    if (!event.data || event.data.source !== 'kodo-host' || event.data.type !== 'eval') return;
    try {
      var result = (0, eval)(event.data.code);
      send('result', [result]);
    } catch (err) {
      send('error', [err]);
    }
  });
})();
</script>
`;

function normalizePath(p: string): string {
  return p.replace(/^\.\//, '').replace(/^\//, '').trim();
}

function findMatchingFile(files: CodeFile[], hrefOrSrc: string): CodeFile | undefined {
  const clean = normalizePath(hrefOrSrc.split('?')[0].split('#')[0]);
  return files.find((f) => normalizePath(f.path) === clean);
}

export function buildHtmlDocument(files: CodeFile[], entryHtmlFile?: CodeFile): string {
  const htmlFile =
    entryHtmlFile ??
    files.find((f) => f.path.toLowerCase() === 'index.html') ??
    files.find((f) => f.path.toLowerCase().endsWith('.html'));

  if (!htmlFile) {
    return buildScriptRunnerHtml(files);
  }

  let doc = htmlFile.content;

  // Replace linked stylesheets with matching virtual CSS files
  doc = doc.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, (tag) => {
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) return tag;
    const matched = findMatchingFile(files, hrefMatch[1]);
    if (!matched) return tag;
    return `<style data-file="${matched.path}">\n${matched.content}\n</style>`;
  });

  // Replace external-style script references with matching virtual JS files
  doc = doc.replace(/<script\b([^>]*)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (full, _pre, src) => {
    const matched = findMatchingFile(files, src);
    if (!matched) return full;
    const safeScript = matched.content.replace(/<\/script/gi, '<\\/script');
    return `<script data-file="${matched.path}">\n${safeScript}\n</script>`;
  });

  if (/<head[^>]*>/i.test(doc)) {
    doc = doc.replace(/<head[^>]*>/i, (match) => `${match}\n${CONSOLE_BRIDGE_SCRIPT}`);
  } else if (/<html[^>]*>/i.test(doc)) {
    doc = doc.replace(/<html[^>]*>/i, (match) => `${match}\n<head>${CONSOLE_BRIDGE_SCRIPT}</head>`);
  } else {
    doc = `${CONSOLE_BRIDGE_SCRIPT}\n${doc}`;
  }

  return doc;
}

export function buildScriptRunnerHtml(files: CodeFile[], activeScript?: CodeFile): string {
  const jsFile =
    activeScript ??
    files.find((f) => f.path.toLowerCase().endsWith('.js')) ??
    files.find((f) => f.path.toLowerCase().endsWith('.ts'));

  const code = jsFile ? jsFile.content.replace(/<\/script/gi, '<\\/script') : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ${CONSOLE_BRIDGE_SCRIPT}
    <style>
      body {
        margin: 0;
        padding: 24px;
        font-family: ui-sans-serif, system-ui, sans-serif;
        background: #0d1117;
        color: #8b949e;
        font-size: 14px;
      }
      .info {
        border: 1px solid #262c36;
        background: #161b22;
        border-radius: 8px;
        padding: 16px 20px;
        max-width: 520px;
      }
      .info strong {
        color: #e6edf3;
        display: block;
        margin-bottom: 6px;
      }
    </style>
  </head>
  <body>
    <div class="info">
      <strong>${jsFile ? `Executed ${jsFile.path}` : 'No executable HTML or JS entry file'}</strong>
      <span>Inspect output in the Console drawer below.</span>
    </div>
    <script>
      ${code}
    </script>
  </body>
</html>`;
}

export function downloadSingleFile(file: CodeFile): void {
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.path.split('/').pop() || 'code.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportProjectAsZip(project: CodeProject): Promise<void> {
  const zip = new JSZip();
  for (const file of project.files) {
    zip.file(file.path, file.content);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = project.name
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '') || 'project';
  a.href = url;
  a.download = `${slug}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
