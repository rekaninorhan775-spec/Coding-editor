import { useMemo, useState } from 'react';
import { marked } from 'marked';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Monitor,
  RotateCw,
  Smartphone,
  Tablet,
  Terminal,
  Trash2,
} from 'lucide-react';
import type {
  CodeFile,
  ConsoleEntry,
  PreviewViewport,
} from '../types/workspace';
import type { Translations } from '../i18n/translations';
import { detectLanguageFromPath } from '../utils/language';

interface PreviewPaneProps {
  srcDoc: string;
  runKey: number;
  activeFile?: CodeFile;
  viewport: PreviewViewport;
  consoleEntries: ConsoleEntry[];
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  t: Translations;
  locale: 'en' | 'ku';
  onChangeViewport: (vp: PreviewViewport) => void;
  onReload: () => void;
  onClearConsole: () => void;
  onEvalConsole: (code: string) => void;
}

export function PreviewPane({
  srcDoc,
  runKey,
  activeFile,
  viewport,
  consoleEntries,
  iframeRef,
  t,
  locale,
  onChangeViewport,
  onReload,
  onClearConsole,
  onEvalConsole,
}: PreviewPaneProps) {
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [previewTab, setPreviewTab] = useState<'auto' | 'browser'>('auto');
  const [replInput, setReplInput] = useState('');

  const activeLang = activeFile ? detectLanguageFromPath(activeFile.path) : 'html';

  const markdownHtml = useMemo(() => {
    if (!activeFile || activeLang !== 'markdown') return '';
    return marked.parse(activeFile.content, { async: false }) as string;
  }, [activeFile, activeLang]);

  const jsonCheck = useMemo(() => {
    if (!activeFile || activeLang !== 'json') return null;
    try {
      const parsed = JSON.parse(activeFile.content);
      return { valid: true as const, formatted: JSON.stringify(parsed, null, 2) };
    } catch (err) {
      return {
        valid: false as const,
        error: err instanceof Error ? err.message : 'Invalid JSON',
      };
    }
  }, [activeFile, activeLang]);

  const showDocumentView =
    previewTab === 'auto' &&
    (activeLang === 'markdown' || activeLang === 'json' || activeLang === 'python' || activeLang === 'plaintext');

  const viewportWidthClass =
    viewport === 'mobile'
      ? 'w-[375px]'
      : viewport === 'tablet'
      ? 'w-[768px]'
      : 'w-full';

  const handleReplSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replInput.trim()) return;
    onEvalConsole(replInput);
    setReplInput('');
  };

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-white dark:bg-[#0D1117]">
      {/* Preview Toolbar */}
      <div
        dir={locale === 'ku' ? 'rtl' : 'ltr'}
        className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-[#F6F8FA] px-3 dark:border-[#262C36] dark:bg-[#161B22]"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-[#E6EDF3] whitespace-nowrap shrink-0">
            {t.preview}
          </span>
          {(activeLang === 'markdown' || activeLang === 'json' || activeLang === 'python') && (
            <div className="flex items-center gap-0.5 rounded-md bg-slate-200/70 p-0.5 dark:bg-[#0D1117]">
              <button
                type="button"
                onClick={() => setPreviewTab('auto')}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  previewTab === 'auto'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1C2128] dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#8B949E]'
                }`}
              >
                {activeLang.toUpperCase()}
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('browser')}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  previewTab === 'browser'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1C2128] dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#8B949E]'
                }`}
              >
                Web
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!showDocumentView && (
            <div className="hidden items-center gap-0.5 rounded-md border border-slate-200 bg-white p-0.5 md:flex dark:border-[#30363D] dark:bg-[#0D1117]">
              <button
                type="button"
                title={t.desktop}
                onClick={() => onChangeViewport('desktop')}
                className={`rounded p-1 transition-colors ${
                  viewport === 'desktop'
                    ? 'bg-slate-200 text-slate-900 dark:bg-[#1C2128] dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-[#8B949E]'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title={t.tablet}
                onClick={() => onChangeViewport('tablet')}
                className={`rounded p-1 transition-colors ${
                  viewport === 'tablet'
                    ? 'bg-slate-200 text-slate-900 dark:bg-[#1C2128] dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-[#8B949E]'
                }`}
              >
                <Tablet className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title={t.mobile}
                onClick={() => onChangeViewport('mobile')}
                className={`rounded p-1 transition-colors ${
                  viewport === 'mobile'
                    ? 'bg-slate-200 text-slate-900 dark:bg-[#1C2128] dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-[#8B949E]'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            title={t.reload}
            onClick={onReload}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 md:min-h-0 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3] dark:hover:bg-[#1C2128] whitespace-nowrap shrink-0"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>{t.reload}</span>
          </button>
        </div>
      </div>

      {/* Main Output Area */}
      <div className="relative flex min-h-0 flex-1 items-stretch justify-center overflow-auto bg-slate-100 dark:bg-[#090C10]">
        {showDocumentView && activeLang === 'markdown' && (
          <div className="h-full w-full overflow-y-auto bg-white p-8 text-slate-800 dark:bg-[#0D1117] dark:text-[#E6EDF3]">
            <article
              className="mx-auto max-w-2xl space-y-4 text-[15px] leading-7 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono-code [&_code]:text-[13px] dark:[&_code]:bg-[#161B22] [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:text-slate-100 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-blue-500 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: markdownHtml }}
            />
          </div>
        )}

        {showDocumentView && activeLang === 'json' && jsonCheck && (
          <div className="h-full w-full overflow-y-auto bg-white p-6 dark:bg-[#0D1117]">
            <div className="mb-4 flex items-center gap-2 text-xs font-medium">
              {jsonCheck.valid ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {t.validJson}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  {t.invalidJson}: {jsonCheck.error}
                </span>
              )}
            </div>
            {jsonCheck.valid && (
              <pre
                dir="ltr"
                className="overflow-x-auto rounded-lg border border-slate-200 bg-[#F6F8FA] p-4 font-mono-code text-xs leading-relaxed text-slate-800 dark:border-[#262C36] dark:bg-[#161B22] dark:text-[#E6EDF3]"
              >
                {jsonCheck.formatted}
              </pre>
            )}
          </div>
        )}

        {showDocumentView && (activeLang === 'python' || activeLang === 'plaintext') && (
          <div className="flex h-full w-full items-center justify-center p-8">
            <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center dark:border-[#262C36] dark:bg-[#161B22]">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-[#E6EDF3]">
                {activeFile?.path}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-[#8B949E]">
                {activeLang === 'python' ? t.pythonNote : t.plainTextNote}
              </p>
            </div>
          </div>
        )}

        {!showDocumentView && (
          <div
            className={`h-full max-w-full bg-white transition-[width] duration-150 ${viewportWidthClass} ${
              viewport !== 'desktop'
                ? 'my-3 h-[calc(100%-24px)] rounded-lg border border-slate-300 shadow-sm dark:border-[#30363D]'
                : ''
            }`}
          >
            <iframe
              key={runKey}
              ref={iframeRef}
              title="Live Code Preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts allow-modals allow-forms"
              className="h-full w-full border-0 bg-white"
            />
          </div>
        )}
      </div>

      {/* Console Drawer */}
      <div className="shrink-0 border-t border-slate-200 bg-[#F6F8FA] dark:border-[#262C36] dark:bg-[#161B22]">
        <div
          dir={locale === 'ku' ? 'rtl' : 'ltr'}
          className="flex h-9 items-center justify-between px-3"
        >
          <button
            type="button"
            onClick={() => setConsoleOpen((o) => !o)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-[#E6EDF3] dark:hover:text-white"
          >
            <Terminal className="h-3.5 w-3.5 text-slate-500" />
            <span>{t.console}</span>
            <span className="font-mono-code text-[11px] font-normal tabular-nums text-slate-400">
              ({consoleEntries.length})
            </span>
            {consoleOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>

          {consoleOpen && (
            <button
              type="button"
              onClick={onClearConsole}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-[#8B949E] dark:hover:bg-[#1C2128] dark:hover:text-white"
            >
              <Trash2 className="h-3 w-3" />
              <span>{t.clear}</span>
            </button>
          )}
        </div>

        {consoleOpen && (
          <div className="flex h-44 flex-col border-t border-slate-200 bg-white dark:border-[#262C36] dark:bg-[#0D1117]">
            <div dir="ltr" className="flex-1 overflow-y-auto p-2 font-mono-code text-xs">
              {consoleEntries.length === 0 ? (
                <div className="px-2 py-4 text-slate-400 dark:text-[#6E7681]">
                  {t.noConsoleOutput}
                </div>
              ) : (
                consoleEntries.map((entry) => {
                  const rowColor =
                    entry.level === 'error'
                      ? 'bg-red-500/8 text-red-600 dark:text-red-400'
                      : entry.level === 'warn'
                      ? 'bg-amber-500/8 text-amber-700 dark:text-amber-300'
                      : entry.level === 'result'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-800 dark:text-[#E6EDF3]';

                  const levelLabel =
                    entry.level === 'error'
                      ? 'ERR'
                      : entry.level === 'warn'
                      ? 'WARN'
                      : entry.level === 'info'
                      ? 'INFO'
                      : entry.level === 'result'
                      ? '=>'
                      : 'LOG';

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-start gap-2.5 rounded px-2 py-1 ${rowColor}`}
                    >
                      <span className="shrink-0 text-[10px] tabular-nums opacity-55">
                        {entry.timestamp}
                      </span>
                      <span className="w-9 shrink-0 text-[10px] font-semibold opacity-75">
                        {levelLabel}
                      </span>
                      <pre className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono-code">
                        {entry.messages.join(' ')}
                      </pre>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleReplSubmit}
              dir="ltr"
              className="flex items-center border-t border-slate-200 px-3 py-1.5 dark:border-[#262C36]"
            >
              <span className="mr-2 font-mono-code text-xs font-semibold text-blue-500">
                &gt;
              </span>
              <input
                type="text"
                value={replInput}
                onChange={(e) => setReplInput(e.target.value)}
                placeholder={t.consolePlaceholder}
                className="w-full bg-transparent font-mono-code text-xs text-slate-900 placeholder:text-slate-400 outline-none dark:text-[#E6EDF3] dark:placeholder:text-[#6E7681]"
              />
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
