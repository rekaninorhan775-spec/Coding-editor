import type { CodeProject } from '../types/workspace';

export interface ProjectTemplate {
  id: string;
  name: string;
  nameKu: string;
  description: string;
  descriptionKu: string;
  files: Array<{ path: string; content: string }>;
  defaultOpenPath: string;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'web-interactive',
    name: 'Interactive Web App',
    nameKu: 'ئەپڵیکەیشنی وێب',
    description: 'HTML, CSS, and JavaScript starter with live DOM state and console logging.',
    descriptionKu: 'سەرەتای HTML و CSS و JavaScript لەگەڵ پێشبینینی ڕاستەوخۆ.',
    defaultOpenPath: 'index.html',
    files: [
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Task Sprint Timer</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="shell">
      <header class="header">
        <h1>Focus Sprint</h1>
        <p class="subtitle">Edit index.html, styles.css, or app.js and see changes live.</p>
      </header>

      <section class="timer-panel">
        <div id="display" class="clock">25:00</div>
        <div class="controls">
          <button id="startBtn" class="btn primary">Start</button>
          <button id="resetBtn" class="btn">Reset</button>
          <button id="modeBtn" class="btn">5m Break</button>
        </div>
      </section>

      <section class="notes">
        <h2>Session Log</h2>
        <ul id="logList" class="log-list"></ul>
      </section>
    </main>
    <script src="app.js"></script>
  </body>
</html>
`,
      },
      {
        path: 'styles.css',
        content: `:root {
  color-scheme: dark;
  --bg: #0f172a;
  --panel: #1e293b;
  --border: #334155;
  --text: #f8fafc;
  --muted: #94a3b8;
  --accent: #3b82f6;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.shell {
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.subtitle {
  margin-top: 6px;
  font-size: 0.9rem;
  color: var(--muted);
}

.timer-panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 28px;
  text-align: center;
}

.clock {
  font-family: ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  font-size: 3.5rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
}

.btn.primary:hover {
  background: #2563eb;
}

.notes h2 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 10px;
}

.log-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--muted);
}
`,
      },
      {
        path: 'app.js',
        content: `const display = document.getElementById('display');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const modeBtn = document.getElementById('modeBtn');
const logList = document.getElementById('logList');

let defaultMinutes = 25;
let secondsLeft = defaultMinutes * 60;
let timerId = null;

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

function addLog(message) {
  const item = document.createElement('li');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  item.textContent = time + ' — ' + message;
  logList.prepend(item);
  console.log(message);
}

function render() {
  display.textContent = formatTime(secondsLeft);
  startBtn.textContent = timerId ? 'Pause' : 'Start';
}

startBtn.addEventListener('click', () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    addLog('Timer paused at ' + formatTime(secondsLeft));
  } else {
    addLog('Timer started (' + defaultMinutes + 'm)');
    timerId = setInterval(() => {
      if (secondsLeft > 0) {
        secondsLeft -= 1;
        render();
      } else {
        clearInterval(timerId);
        timerId = null;
        addLog('Session completed');
        render();
      }
    }, 1000);
  }
  render();
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerId);
  timerId = null;
  secondsLeft = defaultMinutes * 60;
  addLog('Timer reset');
  render();
});

modeBtn.addEventListener('click', () => {
  clearInterval(timerId);
  timerId = null;
  defaultMinutes = defaultMinutes === 25 ? 5 : 25;
  modeBtn.textContent = defaultMinutes === 25 ? '5m Break' : '25m Focus';
  secondsLeft = defaultMinutes * 60;
  addLog('Switched to ' + defaultMinutes + 'm mode');
  render();
});

render();
console.log('Focus Sprint initialized');
`,
      },
      {
        path: 'README.md',
        content: `# Focus Sprint

A clean starter web project ready for editing in **Kodo Studio**.

## Files
- \`index.html\` — Page structure
- \`styles.css\` — Layout and dark theme tokens
- \`app.js\` — Timer logic and DOM event handlers
`,
      },
    ],
  },
  {
    id: 'js-sandbox',
    name: 'JavaScript Sandbox',
    nameKu: 'تاقیگەی JavaScript',
    description: 'Standalone JavaScript workspace with JSON data and console output.',
    descriptionKu: 'نووسینی کۆدی JavaScript و تاقیکردنەوەی ڕاستەوخۆ لە کۆنسۆڵ.',
    defaultOpenPath: 'main.js',
    files: [
      {
        path: 'main.js',
        content: `// Edit this script and press Run (or Ctrl/Cmd + Enter)

const inventory = [
  { name: 'Mechanical Keyboard', category: 'Hardware', price: 145, stock: 12 },
  { name: 'USB-C Hub', category: 'Accessories', price: 49, stock: 28 },
  { name: '27" 4K Display', category: 'Hardware', price: 420, stock: 5 },
  { name: 'Desk Mat', category: 'Accessories', price: 24, stock: 40 },
];

function summarizeByCategory(items) {
  return items.reduce((acc, item) => {
    const current = acc[item.category] || { units: 0, value: 0 };
    current.units += item.stock;
    current.value += item.price * item.stock;
    acc[item.category] = current;
    return acc;
  }, {});
}

console.log('Total products:', inventory.length);
console.log('Category summary:', summarizeByCategory(inventory));

const lowStock = inventory.filter((item) => item.stock < 10);
if (lowStock.length > 0) {
  console.warn('Low stock alert:', lowStock.map((i) => i.name).join(', '));
}
`,
      },
      {
        path: 'data.json',
        content: `{
  "workspace": "js-sandbox",
  "version": "1.0.0",
  "settings": {
    "strict": true,
    "target": "ES2022"
  }
}
`,
      },
    ],
  },
  {
    id: 'blank-web',
    name: 'Blank Web Project',
    nameKu: 'پرۆژەی وێبی بەتاڵ',
    description: 'Minimal HTML, CSS, and JavaScript boilerplate to build from scratch.',
    descriptionKu: 'پرۆژەیەکی سادەی بەتاڵ بۆ دەستپێکردن لە سفرەوە.',
    defaultOpenPath: 'index.html',
    files: [
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Project</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main>
      <h1>Hello, World</h1>
      <p>Start building your project.</p>
    </main>
    <script src="main.js"></script>
  </body>
</html>
`,
      },
      {
        path: 'styles.css',
        content: `body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 40px;
  background: #0f172a;
  color: #f8fafc;
}
`,
      },
      {
        path: 'main.js',
        content: `console.log('Ready to code.');
`,
      },
    ],
  },
  {
    id: 'python-script',
    name: 'Python & Notes',
    nameKu: 'فایلی Python و تێبینی',
    description: 'Create and edit Python scripts, JSON configs, and Markdown docs.',
    descriptionKu: 'نووسین و ڕێکخستنی فایلی Python و JSON و Markdown.',
    defaultOpenPath: 'main.py',
    files: [
      {
        path: 'main.py',
        content: `from dataclasses import dataclass
from typing import List


@dataclass
class Task:
    title: str
    minutes: int
    completed: bool = False


def total_remaining(tasks: List[Task]) -> int:
    return sum(task.minutes for task in tasks if not task.completed)


if __name__ == "__main__":
    backlog = [
        Task("Design schema", 30, completed=True),
        Task("Implement parser", 45),
        Task("Write unit tests", 25),
    ]
    print(f"Remaining work: {total_remaining(backlog)} minutes")
`,
      },
      {
        path: 'README.md',
        content: `# Python Script Project

Edit \`main.py\` with full syntax highlighting and export your project as a ZIP archive anytime.
`,
      },
    ],
  },
];

export function createId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function createProjectFromTemplate(template: ProjectTemplate, customName?: string): CodeProject {
  const now = Date.now();
  const files = template.files.map((f) => ({
    id: createId(),
    path: f.path,
    content: f.content,
    updatedAt: now,
  }));

  const defaultFile = files.find((f) => f.path === template.defaultOpenPath) ?? files[0];

  return {
    id: createId(),
    name: customName?.trim() || template.name,
    description: template.description,
    createdAt: now,
    updatedAt: now,
    files,
    activeFileId: defaultFile.id,
    openFileIds: files.slice(0, 3).map((f) => f.id),
  };
}
