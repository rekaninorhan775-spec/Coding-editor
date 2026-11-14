import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Code2,
  Columns2,
  Copy,
  Download,
  Eraser,
  Eye,
  FilePlus,
  FolderArchive,
  Keyboard,
  Menu,
  Moon,
  MoreVertical,
  PanelLeft,
  Play,
  Plus,
  Sparkles,
  Sun,
  Upload,
  WrapText,
  X,
} from 'lucide-react';
import type {
  CodeFile,
  CodeProject,
  ConsoleEntry,
  ConsoleLevel,
  CursorStats,
  PreviewViewport,
  UiLocale,
  ViewMode,
} from './types/workspace';
import { TRANSLATIONS } from './i18n/translations';
import {
  createId,
  createProjectFromTemplate,
  PROJECT_TEMPLATES,
  type ProjectTemplate,
} from './data/templates';
import {
  detectLanguageFromPath,
  formatCode,
  getFileBadgeColor,
  getFileShortTag,
  getLanguageLabel,
} from './utils/language';
import {
  buildHtmlDocument,
  buildScriptRunnerHtml,
  downloadSingleFile,
  exportProjectAsZip,
} from './utils/bundler';
import {
  CodeMirrorEditor,
  type CodeMirrorEditorHandle,
} from './components/CodeMirrorEditor';
import { FileSidebar } from './components/FileSidebar';
import { PreviewPane } from './components/PreviewPane';
import { NewProjectModal } from './components/NewProjectModal';
import { QuickSymbolBar } from './components/QuickSymbolBar';
import { MobileToolsSheet } from './components/MobileToolsSheet';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/usePWAInstall';

const STORAGE_KEY_PROJECTS = 'kodo_studio_projects_v1';
const STORAGE_KEY_ACTIVE_PROJECT = 'kodo_studio_active_project_v1';
const STORAGE_KEY_PREFS = 'kodo_studio_prefs_v1';

interface StoredPrefs {
  theme: 'dark' | 'light';
  locale: UiLocale;
  wordWrap: boolean;
  fontSize: number;
  autoRun: boolean;
  showQuickBar: boolean;
}

function loadInitialProjects(): CodeProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (raw) {
      const parsed = JSON.parse(raw) as CodeProject[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to starter templates
  }
  return [
    createProjectFromTemplate(PROJECT_TEMPLATES[0], 'Focus Sprint'),
    createProjectFromTemplate(PROJECT_TEMPLATES[1], 'JS Sandbox'),
  ];
}

function loadInitialPrefs(): StoredPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
      return {
        theme: parsed.theme === 'light' ? 'light' : 'dark',
        locale: parsed.locale === 'ku' ? 'ku' : 'en',
        wordWrap: typeof parsed.wordWrap === 'boolean' ? parsed.wordWrap : true,
        fontSize: typeof parsed.fontSize === 'number' ? parsed.fontSize : 14,
        autoRun: typeof parsed.autoRun === 'boolean' ? parsed.autoRun : true,
        showQuickBar: typeof parsed.showQuickBar === 'boolean' ? parsed.showQuickBar : true,
      };
    }
  } catch {
    // Ignore storage error
  }
  return {
    theme: 'dark',
    locale: 'en',
    wordWrap: true,
    fontSize: 14,
    autoRun: true,
    showQuickBar: true,
  };
}

function formatNowTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function App() {
  const [projects, setProjects] = useState<CodeProject[]>(loadInitialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_PROJECT);
    return saved || '';
  });

  const initialPrefs = useMemo(loadInitialPrefs, []);
  const [theme, setTheme] = useState<'dark' | 'light'>(initialPrefs.theme);
  const [locale, setLocale] = useState<UiLocale>(initialPrefs.locale);
  const [wordWrap, setWordWrap] = useState<boolean>(initialPrefs.wordWrap);
  const [fontSize, setFontSize] = useState<number>(initialPrefs.fontSize);
  const [autoRun, setAutoRun] = useState<boolean>(initialPrefs.autoRun);
  const [showQuickBar, setShowQuickBar] = useState<boolean>(initialPrefs.showQuickBar);

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'code' : 'split'
  );
  const [mobileToolsOpen, setMobileToolsOpen] = useState<boolean>(false);
  const [viewport, setViewport] = useState<PreviewViewport>('desktop');
  const [splitPercent, setSplitPercent] = useState<number>(52);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

  const [newProjectOpen, setNewProjectOpen] = useState<boolean>(false);
  const [copiedFlag, setCopiedFlag] = useState<boolean>(false);
  const [savedFlash, setSavedFlash] = useState<boolean>(false);

  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [runKey, setRunKey] = useState<number>(1);
  const [liveSrcDoc, setLiveSrcDoc] = useState<string>('');
  const [cursorStats, setCursorStats] = useState<CursorStats>({
    line: 1,
    col: 1,
    lines: 1,
    length: 0,
    selectionLength: 0,
  });

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<CodeMirrorEditorHandle | null>(null);
  const globalUploadRef = useRef<HTMLInputElement | null>(null);
  const isOnline = useOnlineStatus();

  const t = TRANSLATIONS[locale];

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId]
  );

  const activeFile = useMemo(
    () =>
      activeProject.files.find((f) => f.id === activeProject.activeFileId) ??
      activeProject.files[0],
    [activeProject]
  );

  const openFiles = useMemo(() => {
    const map = new Map(activeProject.files.map((f) => [f.id, f]));
    return activeProject.openFileIds
      .map((id) => map.get(id))
      .filter((f): f is CodeFile => Boolean(f));
  }, [activeProject]);

  // Sync Tailwind dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Persist projects and preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
      localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT, activeProject.id);
    } catch {
      // Ignore quota errors
    }
  }, [projects, activeProject.id]);

  // Track mobile breakpoint cleanly
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = (matches: boolean) => {
      setIsMobile(matches);
      if (matches) {
        setViewMode((cur) => (cur === 'split' ? 'code' : cur));
      }
    };
    sync(mq.matches);
    const handler = (e: MediaQueryListEvent) => sync(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_PREFS,
        JSON.stringify({ theme, locale, wordWrap, fontSize, autoRun, showQuickBar })
      );
    } catch {
      // Ignore storage errors
    }
  }, [theme, locale, wordWrap, fontSize, autoRun, showQuickBar]);

  // Listen for console messages from sandboxed preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.source !== 'kodo-preview') return;
      if (event.data.type === 'clear') {
        setConsoleEntries([]);
        return;
      }
      if (event.data.type === 'console') {
        const level = (event.data.level as ConsoleLevel) || 'log';
        const messages = Array.isArray(event.data.messages)
          ? event.data.messages.map(String)
          : [String(event.data.messages)];
        setConsoleEntries((prev) => [
          ...prev.slice(-199),
          {
            id: createId(),
            level,
            messages,
            timestamp: formatNowTime(),
          },
        ]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const compileAndRun = useCallback(
    (clearLogs = true) => {
      if (clearLogs) {
        setConsoleEntries([]);
      }
      const hasHtml = activeProject.files.some((f) =>
        f.path.toLowerCase().endsWith('.html')
      );
      const selectedHtml =
        activeFile && activeFile.path.toLowerCase().endsWith('.html')
          ? activeFile
          : undefined;
      const selectedScript =
        activeFile &&
        (activeFile.path.toLowerCase().endsWith('.js') ||
          activeFile.path.toLowerCase().endsWith('.ts'))
          ? activeFile
          : undefined;

      const htmlDoc = hasHtml
        ? buildHtmlDocument(activeProject.files, selectedHtml)
        : buildScriptRunnerHtml(activeProject.files, selectedScript);

      setLiveSrcDoc(htmlDoc);
      setRunKey((k) => k + 1);
    },
    [activeProject.files, activeFile]
  );

  // Initial run and debounced auto-run on file edits
  useEffect(() => {
    if (!autoRun && liveSrcDoc !== '') return;
    const timer = window.setTimeout(
      () => {
        compileAndRun(true);
      },
      liveSrcDoc === '' ? 0 : 450
    );
    return () => window.clearTimeout(timer);
  }, [activeProject.id, activeProject.files, autoRun, compileAndRun, liveSrcDoc]);

  // Split drag handlers
  useEffect(() => {
    if (!isDraggingSplit) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const pct = Math.min(78, Math.max(24, (relX / rect.width) * 100));
      setSplitPercent(pct);
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplit]);

  const updateActiveProject = useCallback(
    (updater: (proj: CodeProject) => CodeProject) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProject.id ? updater(p) : p))
      );
    },
    [activeProject.id]
  );

  const handleCodeChange = useCallback(
    (nextContent: string) => {
      if (!activeFile) return;
      const fileId = activeFile.id;
      updateActiveProject((proj) => ({
        ...proj,
        updatedAt: Date.now(),
        files: proj.files.map((f) =>
          f.id === fileId ? { ...f, content: nextContent, updatedAt: Date.now() } : f
        ),
      }));
    },
    [activeFile, updateActiveProject]
  );

  const handleSelectFile = (fileId: string) => {
    updateActiveProject((proj) => ({
      ...proj,
      activeFileId: fileId,
      openFileIds: proj.openFileIds.includes(fileId)
        ? proj.openFileIds
        : [...proj.openFileIds, fileId],
    }));
  };

  const handleCloseTab = (fileId: string) => {
    updateActiveProject((proj) => {
      const nextOpen = proj.openFileIds.filter((id) => id !== fileId);
      const nextActive =
        proj.activeFileId === fileId
          ? nextOpen[nextOpen.length - 1] ?? ''
          : proj.activeFileId;
      return {
        ...proj,
        openFileIds: nextOpen,
        activeFileId: nextActive,
      };
    });
  };

  const handleCreateFile = (rawPath: string) => {
    const clean = rawPath.replace(/^\/+|\/+$/g, '');
    if (!clean) return;
    const existing = activeProject.files.find(
      (f) => f.path.toLowerCase() === clean.toLowerCase()
    );
    if (existing) {
      handleSelectFile(existing.id);
      return;
    }

    const lang = detectLanguageFromPath(clean);
    let starter = '';
    if (lang === 'html') {
      starter = `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>${clean}</title>\n  </head>\n  <body>\n    <h1>New Page</h1>\n  </body>\n</html>\n`;
    } else if (lang === 'css') {
      starter = `/* Styles for ${clean} */\n`;
    } else if (lang === 'json') {
      starter = `{\n  "name": "example"\n}\n`;
    } else if (lang === 'markdown') {
      starter = `# ${clean.replace(/\.md$/i, '')}\n\nWrite documentation here.\n`;
    }

    const newFile: CodeFile = {
      id: createId(),
      path: clean,
      content: starter,
      updatedAt: Date.now(),
    };

    updateActiveProject((proj) => ({
      ...proj,
      updatedAt: Date.now(),
      files: [...proj.files, newFile],
      activeFileId: newFile.id,
      openFileIds: [...proj.openFileIds, newFile.id],
    }));
  };

  const handleRenameFile = (fileId: string, newPath: string) => {
    const clean = newPath.replace(/^\/+|\/+$/g, '');
    if (!clean) return;
    const collision = activeProject.files.some(
      (f) => f.id !== fileId && f.path.toLowerCase() === clean.toLowerCase()
    );
    if (collision) return;

    updateActiveProject((proj) => ({
      ...proj,
      updatedAt: Date.now(),
      files: proj.files.map((f) =>
        f.id === fileId ? { ...f, path: clean, updatedAt: Date.now() } : f
      ),
    }));
  };

  const handleDuplicateFile = (fileId: string) => {
    const src = activeProject.files.find((f) => f.id === fileId);
    if (!src) return;
    const dotIndex = src.path.lastIndexOf('.');
    const base = dotIndex > 0 ? src.path.slice(0, dotIndex) : src.path;
    const ext = dotIndex > 0 ? src.path.slice(dotIndex) : '';
    let copyPath = `${base}-copy${ext}`;
    let counter = 2;
    while (activeProject.files.some((f) => f.path.toLowerCase() === copyPath.toLowerCase())) {
      copyPath = `${base}-copy-${counter}${ext}`;
      counter++;
    }

    const dup: CodeFile = {
      id: createId(),
      path: copyPath,
      content: src.content,
      updatedAt: Date.now(),
    };

    updateActiveProject((proj) => ({
      ...proj,
      updatedAt: Date.now(),
      files: [...proj.files, dup],
      activeFileId: dup.id,
      openFileIds: [...proj.openFileIds, dup.id],
    }));
  };

  const handleDeleteFile = (fileId: string) => {
    if (activeProject.files.length <= 1) return;
    updateActiveProject((proj) => {
      const remaining = proj.files.filter((f) => f.id !== fileId);
      const nextOpen = proj.openFileIds.filter((id) => id !== fileId);
      const nextActive =
        proj.activeFileId === fileId
          ? nextOpen[nextOpen.length - 1] ?? remaining[0]?.id ?? ''
          : proj.activeFileId;
      return {
        ...proj,
        updatedAt: Date.now(),
        files: remaining,
        openFileIds: nextOpen.length > 0 ? nextOpen : nextActive ? [nextActive] : [],
        activeFileId: nextActive,
      };
    });
  };

  const handleImportFiles = (imported: Array<{ path: string; content: string }>) => {
    if (imported.length === 0) return;
    updateActiveProject((proj) => {
      const nextFiles = [...proj.files];
      let lastId = proj.activeFileId;
      const nextOpen = [...proj.openFileIds];

      for (const item of imported) {
        const clean = item.path.replace(/^\/+|\/+$/g, '');
        const existingIdx = nextFiles.findIndex(
          (f) => f.path.toLowerCase() === clean.toLowerCase()
        );
        if (existingIdx >= 0) {
          nextFiles[existingIdx] = {
            ...nextFiles[existingIdx],
            content: item.content,
            updatedAt: Date.now(),
          };
          lastId = nextFiles[existingIdx].id;
        } else {
          const nf: CodeFile = {
            id: createId(),
            path: clean,
            content: item.content,
            updatedAt: Date.now(),
          };
          nextFiles.push(nf);
          lastId = nf.id;
          nextOpen.push(nf.id);
        }
      }

      return {
        ...proj,
        updatedAt: Date.now(),
        files: nextFiles,
        activeFileId: lastId,
        openFileIds: Array.from(new Set(nextOpen)),
      };
    });
  };

  const handleCreateProject = (template: ProjectTemplate, name: string) => {
    const newProj = createProjectFromTemplate(template, name);
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setConsoleEntries([]);
  };

  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) return;
    const next = projects.filter((p) => p.id !== projectId);
    setProjects(next);
    if (activeProject.id === projectId && next[0]) {
      setActiveProjectId(next[0].id);
    }
  };

  const handleFormatActiveFile = () => {
    if (!activeFile) return;
    try {
      const lang = detectLanguageFromPath(activeFile.path);
      const formatted = formatCode(activeFile.content, lang);
      handleCodeChange(formatted);
    } catch (err) {
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: createId(),
          level: 'error',
          messages: [
            `Format failed (${activeFile.path}):`,
            err instanceof Error ? err.message : String(err),
          ],
          timestamp: formatNowTime(),
        },
      ]);
    }
  };

  const handleCopyCode = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopiedFlag(true);
      window.setTimeout(() => setCopiedFlag(false), 1500);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleSaveFlash = useCallback(() => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
  }, []);

  const handleEvalConsole = (code: string) => {
    setConsoleEntries((prev) => [
      ...prev,
      {
        id: createId(),
        level: 'log',
        messages: [`> ${code}`],
        timestamp: formatNowTime(),
      },
    ]);
    iframeRef.current?.contentWindow?.postMessage(
      { source: 'kodo-host', type: 'eval', code },
      '*'
    );
  };

  const handleClearActiveCode = useCallback(() => {
    if (!activeFile) return;
    editorRef.current?.clearAll();
    handleCodeChange('');
    setConsoleEntries([]);
  }, [activeFile, handleCodeChange]);

  const handleTriggerUpload = useCallback(() => {
    globalUploadRef.current?.click();
  }, []);

  const handleGlobalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const imported: Array<{ path: string; content: string }> = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      const text = await f.text();
      imported.push({ path: f.name, content: text });
    }
    handleImportFiles(imported);
    if (isMobile) {
      setViewMode('code');
    }
    e.target.value = '';
  };

  const activeLang = activeFile ? detectLanguageFromPath(activeFile.path) : 'plaintext';
  const effectiveViewMode: ViewMode =
    isMobile && viewMode === 'split' ? 'code' : viewMode;

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-white pt-[max(env(safe-area-inset-top),10px)] pb-[env(safe-area-inset-bottom)] text-slate-900 dark:bg-[#0D1117] dark:text-[#E6EDF3]">
      {/* Very Top-Right Corner Developer Credit */}
      <div className="flex h-7 shrink-0 items-center justify-end border-b border-slate-200 bg-[#F6F8FA] px-3.5 dark:border-[#262C36] dark:bg-[#161B22]">
        <span className="text-[11px] font-medium text-slate-600 dark:text-[#8B949E] whitespace-nowrap">
          Create By : Developer Norhan
        </span>
      </div>

      {/* Top Bar: Adapts cleanly between Mobile QuickEdit bar and Desktop 3-zone header */}
      <header className="flex min-h-[50px] shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-[#F6F8FA] px-2.5 py-1.5 md:gap-6 md:px-4 dark:border-[#262C36] dark:bg-[#161B22]">
        {/* Zone 1: Mobile Menu + Brand / Breadcrumb */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 md:flex-initial md:gap-2.5">
          <button
            type="button"
            onClick={() => setSidebarOpen((s) => !s)}
            aria-label={t.toggleSidebar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200/70 md:hidden dark:text-[#E6EDF3] dark:hover:bg-[#1C2128]"
          >
            <Menu className="h-5 w-5" />
          </button>

          <img
            src="/icon.svg"
            alt="Coding Editor"
            className="h-6 w-6 shrink-0 rounded-md"
          />
          <span className="hidden text-sm font-bold tracking-tight text-slate-900 md:inline dark:text-white whitespace-nowrap shrink-0">
            {t.appName}
          </span>
          <span className="hidden text-slate-300 md:inline dark:text-[#30363D]" aria-hidden="true">
            /
          </span>
          <span className="min-w-0 truncate text-xs font-semibold text-slate-800 md:font-medium md:text-slate-600 dark:text-[#E6EDF3] dark:md:text-[#8B949E]">
            {activeProject.name}
          </span>
          {activeFile && (
            <>
              <span className="hidden text-slate-300 sm:inline dark:text-[#30363D]" aria-hidden="true">
                /
              </span>
              <span
                dir="ltr"
                className="hidden truncate font-mono-code text-xs text-slate-500 sm:inline dark:text-[#6E7681]"
              >
                {activeFile.path}
              </span>
            </>
          )}
        </div>

        {/* Zone 2: View Switcher (Code | Preview on mobile, Split | Code | Preview on desktop) */}
        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-[#30363D] dark:bg-[#0D1117]">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors md:inline-flex whitespace-nowrap shrink-0 ${
              effectiveViewMode === 'split'
                ? 'bg-slate-900 text-white dark:bg-[#1C2128] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-[#8B949E] dark:hover:text-white'
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            <span>{t.splitView}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('code')}
            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors md:min-h-0 whitespace-nowrap shrink-0 ${
              effectiveViewMode === 'code'
                ? 'bg-slate-900 text-white dark:bg-[#1C2128] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-[#8B949E] dark:hover:text-white'
            }`}
          >
            <Code2 className="hidden h-3.5 w-3.5 sm:inline" />
            <span>{t.codeView}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors md:min-h-0 whitespace-nowrap shrink-0 ${
              effectiveViewMode === 'preview'
                ? 'bg-slate-900 text-white dark:bg-[#1C2128] dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-[#8B949E] dark:hover:text-white'
            }`}
          >
            <Eye className="hidden h-3.5 w-3.5 sm:inline" />
            <span>{t.previewView}</span>
          </button>
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          <button
            type="button"
            onClick={() => exportProjectAsZip(activeProject)}
            className="hidden items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 md:inline-flex dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3] dark:hover:bg-[#1C2128] whitespace-nowrap shrink-0"
          >
            <FolderArchive className="h-3.5 w-3.5" />
            <span>{t.exportZip}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              compileAndRun(true);
              if (isMobile) setViewMode('preview');
            }}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 sm:gap-1.5 sm:px-3 md:min-h-0 md:px-3.5 whitespace-nowrap shrink-0"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{t.run}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileToolsOpen(true)}
            aria-label={t.moreActions}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200/70 md:hidden dark:text-[#E6EDF3] dark:hover:bg-[#1C2128]"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Desktop Secondary Workspace Controls Bar (hidden on mobile to maximize coding viewport) */}
      <div
        dir={locale === 'ku' ? 'rtl' : 'ltr'}
        className="hidden h-11 shrink-0 items-center justify-between gap-4 overflow-x-auto border-b border-slate-200 bg-white px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex dark:border-[#262C36] dark:bg-[#0D1117]"
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSidebarOpen((s) => !s)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              sidebarOpen
                ? 'bg-slate-100 text-slate-900 dark:bg-[#1C2128] dark:text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-[#8B949E] dark:hover:bg-[#1C2128]'
            }`}
          >
            <PanelLeft className="h-3.5 w-3.5" />
            <span>{t.toggleSidebar}</span>
          </button>

          <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-[#262C36]" />

          {activeFile && (
            <>
              <button
                type="button"
                onClick={handleFormatActiveFile}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-[#8B949E] dark:hover:bg-[#1C2128] dark:hover:text-white whitespace-nowrap shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t.format}</span>
              </button>

              <button
                type="button"
                onClick={() => setWordWrap((w) => !w)}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  wordWrap
                    ? 'bg-slate-100 text-slate-900 dark:bg-[#1C2128] dark:text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-[#8B949E] dark:hover:bg-[#1C2128]'
                }`}
              >
                <WrapText className="h-3.5 w-3.5" />
                <span>{t.wrap}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-[#8B949E] dark:hover:bg-[#1C2128] dark:hover:text-white whitespace-nowrap shrink-0"
              >
                {copiedFlag ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedFlag ? t.copied : t.copy}</span>
              </button>

              <button
                type="button"
                onClick={() => downloadSingleFile(activeFile)}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-[#8B949E] dark:hover:bg-[#1C2128] dark:hover:text-white whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{t.downloadFile}</span>
              </button>

              <button
                type="button"
                onClick={handleClearActiveCode}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15 whitespace-nowrap shrink-0"
              >
                <Eraser className="h-3.5 w-3.5" />
                <span>{t.clearCode}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleTriggerUpload}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/15 whitespace-nowrap shrink-0"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{t.uploadFile}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton t={t} locale={locale} variant="toolbar" />
          <button
            type="button"
            onClick={() => setShowQuickBar((q) => !q)}
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              showQuickBar
                ? 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'border-slate-200 text-slate-500 hover:text-slate-900 dark:border-[#30363D] dark:text-[#8B949E]'
            }`}
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>{t.quickBar}</span>
          </button>

          {/* Font size stepper */}
          <div className="flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-xs dark:border-[#30363D]">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(11, s - 1))}
              className="px-1 text-slate-500 hover:text-slate-900 dark:text-[#8B949E] dark:hover:text-white"
              aria-label="Decrease font size"
            >
              -
            </button>
            <span className="min-w-[30px] text-center font-mono-code text-[11px] tabular-nums text-slate-700 dark:text-[#E6EDF3]">
              {fontSize}px
            </span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(22, s + 1))}
              className="px-1 text-slate-500 hover:text-slate-900 dark:text-[#8B949E] dark:hover:text-white"
              aria-label="Increase font size"
            >
              +
            </button>
          </div>

          {/* Auto-run toggle */}
          <button
            type="button"
            onClick={() => setAutoRun((a) => !a)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              autoRun
                ? 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'border-slate-200 text-slate-500 hover:text-slate-900 dark:border-[#30363D] dark:text-[#8B949E]'
            }`}
          >
            {t.autoRun}
          </button>

          {/* Language Switcher EN / کوردی */}
          <button
            type="button"
            onClick={() => setLocale((l) => (l === 'en' ? 'ku' : 'en'))}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-[#30363D] dark:text-[#E6EDF3] dark:hover:bg-[#1C2128] whitespace-nowrap shrink-0"
          >
            {locale === 'en' ? 'کوردی' : 'English'}
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => setTheme((cur) => (cur === 'dark' ? 'light' : 'dark'))}
            title={theme === 'dark' ? t.lightMode : t.darkMode}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-[#30363D] dark:text-[#E6EDF3] dark:hover:bg-[#1C2128] whitespace-nowrap shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-slate-600" />
            )}
            <span>{theme === 'dark' ? t.lightMode : t.darkMode}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Desktop Persistent Sidebar */}
        {sidebarOpen && !isMobile && (
          <FileSidebar
            projects={projects}
            activeProject={activeProject}
            activeFileId={activeFile?.id ?? ''}
            t={t}
            locale={locale}
            onSelectProject={(id) => {
              setActiveProjectId(id);
              setConsoleEntries([]);
            }}
            onOpenNewProjectModal={() => setNewProjectOpen(true)}
            onDeleteProject={handleDeleteProject}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onRenameFile={handleRenameFile}
            onDuplicateFile={handleDuplicateFile}
            onDeleteFile={handleDeleteFile}
            onImportFiles={handleImportFiles}
          />
        )}

        {/* Mobile Slide-Over Drawer (QuickEdit style) */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 z-40 flex bg-black/55 backdrop-blur-xs md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div onClick={(e) => e.stopPropagation()} className="h-full">
              <FileSidebar
                projects={projects}
                activeProject={activeProject}
                activeFileId={activeFile?.id ?? ''}
                t={t}
                locale={locale}
                onSelectProject={(id) => {
                  setActiveProjectId(id);
                  setConsoleEntries([]);
                }}
                onOpenNewProjectModal={() => {
                  setSidebarOpen(false);
                  setNewProjectOpen(true);
                }}
                onDeleteProject={handleDeleteProject}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onRenameFile={handleRenameFile}
                onDuplicateFile={handleDuplicateFile}
                onDeleteFile={handleDeleteFile}
                onImportFiles={handleImportFiles}
                onCloseMobileDrawer={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        <div ref={workspaceRef} className="relative flex min-w-0 flex-1 overflow-hidden">
          {/* Code Editor Pane */}
          {effectiveViewMode !== 'preview' && (
            <div
              className="flex h-full min-w-0 flex-col bg-white dark:bg-[#0D1117]"
              style={{
                width: effectiveViewMode === 'split' ? `${splitPercent}%` : '100%',
              }}
            >
              {/* Open File Tabs (Scrollable + Quick New File button) */}
              <div className="flex h-10 shrink-0 items-center overflow-x-auto border-b border-slate-200 bg-[#F6F8FA] md:h-9 dark:border-[#262C36] dark:bg-[#161B22]">
                {openFiles.map((file) => {
                  const isActive = activeFile?.id === file.id;
                  const lang = detectLanguageFromPath(file.path);
                  const badgeColor = getFileBadgeColor(lang);
                  const shortTag = getFileShortTag(file.path);
                  const fileName = file.path.split('/').pop() || file.path;

                  return (
                    <div
                      key={file.id}
                      className={`group flex h-full shrink-0 items-center gap-1.5 border-r border-slate-200 px-3 text-xs transition-colors dark:border-[#262C36] ${
                        isActive
                          ? 'bg-white font-semibold text-slate-900 dark:bg-[#0D1117] dark:text-white'
                          : 'text-slate-600 hover:bg-slate-200/50 dark:text-[#8B949E] dark:hover:bg-[#1C2128]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectFile(file.id)}
                        className="flex h-full items-center gap-2 whitespace-nowrap"
                      >
                        <span className={`font-mono-code text-[10px] font-semibold ${badgeColor}`}>
                          {shortTag}
                        </span>
                        <span dir="ltr">{fileName}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCloseTab(file.id)}
                        aria-label={`Close ${fileName}`}
                        className="flex h-7 w-7 items-center justify-center rounded text-slate-400 opacity-70 transition-opacity hover:bg-slate-200 hover:text-slate-900 md:h-auto md:w-auto md:p-0.5 md:opacity-60 md:group-hover:opacity-100 dark:hover:bg-[#30363D] dark:hover:text-white"
                      >
                        <X className="h-3.5 w-3.5 md:h-3 md:w-3" />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  title={t.newFile}
                  aria-label={t.newFile}
                  onClick={() => {
                    const num = activeProject.files.length + 1;
                    handleCreateFile(`script-${num}.js`);
                  }}
                  className="flex h-full min-w-[40px] shrink-0 items-center justify-center px-2 text-slate-500 hover:bg-slate-200/60 hover:text-slate-900 dark:text-[#8B949E] dark:hover:bg-[#1C2128] dark:hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Editor Canvas */}
              <div className="min-h-0 flex-1 overflow-hidden">
                {activeFile && openFiles.length > 0 ? (
                  <CodeMirrorEditor
                    ref={editorRef}
                    fileId={activeFile.id}
                    value={activeFile.content}
                    language={activeLang}
                    theme={theme}
                    wordWrap={wordWrap}
                    fontSize={fontSize}
                    onChange={handleCodeChange}
                    onCursorChange={setCursorStats}
                    onSaveShortcut={handleSaveFlash}
                    onRunShortcut={() => compileAndRun(true)}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <p className="max-w-sm text-sm text-slate-500 dark:text-[#8B949E]">
                      {t.noOpenFiles}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCreateFile('untitled.js')}
                      className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500"
                    >
                      <FilePlus className="h-3.5 w-3.5" />
                      <span>{t.createFirstFile}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* QuickEdit Mobile Coding Symbol Bar */}
              {activeFile && openFiles.length > 0 && showQuickBar && (
                <QuickSymbolBar
                  t={t}
                  onInsert={(text, offset) => editorRef.current?.insertText(text, offset)}
                  onUndo={() => editorRef.current?.undoAction()}
                  onRedo={() => editorRef.current?.redoAction()}
                  onFind={() => editorRef.current?.openSearch()}
                  onClear={handleClearActiveCode}
                  onUpload={handleTriggerUpload}
                />
              )}
            </div>
          )}

          {/* Resizable Split Handle */}
          {effectiveViewMode === 'split' && (
            <div
              role="separator"
              aria-orientation="vertical"
              onMouseDown={() => setIsDraggingSplit(true)}
              className="group relative z-10 w-1.5 shrink-0 cursor-col-resize bg-slate-200 transition-colors hover:bg-blue-500 dark:bg-[#262C36] dark:hover:bg-blue-500"
            />
          )}

          {/* Preview & Console Pane */}
          {effectiveViewMode !== 'code' && (
            <div
              className="flex h-full min-w-0 flex-1"
              style={{
                width: effectiveViewMode === 'split' ? `${100 - splitPercent}%` : '100%',
              }}
            >
              <PreviewPane
                srcDoc={liveSrcDoc}
                runKey={runKey}
                activeFile={activeFile}
                viewport={viewport}
                consoleEntries={consoleEntries}
                iframeRef={iframeRef}
                t={t}
                locale={locale}
                onChangeViewport={setViewport}
                onReload={() => compileAndRun(true)}
                onClearConsole={() => setConsoleEntries([])}
                onEvalConsole={handleEvalConsole}
              />
            </div>
          )}

          {/* Transparent drag shield over iframe during resize */}
          {isDraggingSplit && (
            <div className="fixed inset-0 z-40 cursor-col-resize" />
          )}
        </div>
      </div>

      {/* Minimal Status Footer (Desktop; hidden on mobile so QuickSymbolBar has full thumb priority) */}
      <footer className="hidden h-7 shrink-0 items-center justify-between border-t border-slate-200 bg-[#F6F8FA] px-4 text-[11px] text-slate-500 md:flex dark:border-[#262C36] dark:bg-[#161B22] dark:text-[#8B949E]">
        <div className="flex items-center gap-4">
          {activeFile && (
            <>
              <span className="font-mono-code tabular-nums">
                {t.lineCol(cursorStats.line, cursorStats.col)}
              </span>
              <span className="font-mono-code tabular-nums">
                {t.linesCount(cursorStats.lines)}
              </span>
            </>
          )}
          {savedFlash && (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {t.saved}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          {activeFile && (
            <span className="font-medium text-slate-700 dark:text-[#E6EDF3]">
              {getLanguageLabel(activeLang)}
            </span>
          )}
        </div>
      </footer>

      <MobileToolsSheet
        open={mobileToolsOpen}
        t={t}
        locale={locale}
        theme={theme}
        wordWrap={wordWrap}
        fontSize={fontSize}
        autoRun={autoRun}
        showQuickBar={showQuickBar}
        copiedFlag={copiedFlag}
        hasActiveFile={Boolean(activeFile)}
        onClose={() => setMobileToolsOpen(false)}
        onFormat={handleFormatActiveFile}
        onFind={() => {
          setViewMode('code');
          window.setTimeout(() => editorRef.current?.openSearch(), 50);
        }}
        onCopy={handleCopyCode}
        onDownloadFile={() => {
          if (activeFile) downloadSingleFile(activeFile);
        }}
        onExportZip={() => exportProjectAsZip(activeProject)}
        onUploadFile={handleTriggerUpload}
        onClearCode={handleClearActiveCode}
        onChangeFontSize={(delta) =>
          setFontSize((s) => Math.min(22, Math.max(11, s + delta)))
        }
        onToggleWrap={() => setWordWrap((w) => !w)}
        onToggleAutoRun={() => setAutoRun((a) => !a)}
        onToggleQuickBar={() => setShowQuickBar((q) => !q)}
        onToggleTheme={() => setTheme((cur) => (cur === 'dark' ? 'light' : 'dark'))}
        onToggleLocale={() => setLocale((l) => (l === 'en' ? 'ku' : 'en'))}
      />

      <input
        ref={globalUploadRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleGlobalFileUpload}
      />

      <NewProjectModal
        open={newProjectOpen}
        t={t}
        locale={locale}
        onClose={() => setNewProjectOpen(false)}
        onCreate={handleCreateProject}
      />
      {!isOnline && (
        <div className="fixed bottom-12 left-3 z-50 rounded-lg border border-amber-500/40 bg-amber-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          {t.offlineMode}
        </div>
      )}
    </div>
  );
}
