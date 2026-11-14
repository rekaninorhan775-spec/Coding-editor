import { useState } from 'react';
import {
  AlertCircle,
  Bot,
  Check,
  Copy,
  FilePlus2,
  Loader2,
  Replace,
  Send,
  Sparkles,
  TextCursorInput,
  X,
} from 'lucide-react';
import type { CodeFile, UiLocale } from '../types/workspace';
import type { Translations } from '../i18n/translations';

interface AICodeModalProps {
  open: boolean;
  t: Translations;
  locale: UiLocale;
  activeFile?: CodeFile;
  projectFiles: CodeFile[];
  onClose: () => void;
  onInsertAtCursor: (code: string) => void;
  onReplaceActiveFile: (code: string) => void;
  onCreateNewFile: (path: string, code: string) => void;
}

interface GeneratedResult {
  explanation: string;
  filename: string;
  code: string;
}

export function AICodeModal({
  open,
  t,
  locale,
  activeFile,
  projectFiles,
  onClose,
  onInsertAtCursor,
  onReplaceActiveFile,
  onCreateNewFile,
}: AICodeModalProps) {
  const [prompt, setPrompt] = useState('');
  const [includeContext, setIncludeContext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [targetFilename, setTargetFilename] = useState('');

  if (!open) return null;

  const quickPrompts =
    locale === 'ku'
      ? [
          {
            label: t.aiQuickHtmlCard,
            text: 'بۆ من لاپەڕەکێ HTML و CSS یێ مودێرن بۆ کارتێ پرۆفایلی دروست بکە ب دیزاینەکێ جوان و responsive.',
          },
          {
            label: t.aiQuickCalculator,
            text: 'بۆ من ئەپەکێ ژمێریار (Calculator) ب HTML و CSS و JavaScript دروست بکە کو د مۆبایلدا جوان کار بکەت.',
          },
          {
            label: t.aiQuickTodo,
            text: 'بۆ من لیستا کاران (To-Do List) ب HTML و CSS و JavaScript چێبکە کو زێدەکرن و سڕینەوە و نیشانکرنا تەمامبوونێ تێدا بیت.',
          },
          {
            label: t.aiQuickPython,
            text: 'بۆ من کۆدەکێ Python بنڤیسە بۆ ڕێکخستن و هەژمارتنا داتایان د ناڤ لیستان دا.',
          },
        ]
      : [
          {
            label: t.aiQuickHtmlCard,
            text: 'Create a modern, responsive HTML & CSS profile card page with clean typography and interactive hover states.',
          },
          {
            label: t.aiQuickCalculator,
            text: 'Build a complete calculator web app in a single HTML file with CSS and JavaScript that works cleanly on mobile.',
          },
          {
            label: t.aiQuickTodo,
            text: 'Build a To-Do List app with HTML, CSS, and JavaScript supporting add, complete toggle, delete, and localStorage persistence.',
          },
          {
            label: t.aiQuickPython,
            text: 'Write a clean Python utility script with functions to parse, filter, and summarize structured data.',
          },
        ];

  const handleGenerate = async (overridePrompt?: string) => {
    const query = (overridePrompt ?? prompt).trim();
    if (!query || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          locale,
          activeFilePath: includeContext ? activeFile?.path : undefined,
          activeFileContent: includeContext ? activeFile?.content : undefined,
          projectFiles: projectFiles.map((f) => ({ path: f.path })),
        }),
      });

      const data = (await response.json()) as Partial<GeneratedResult> & {
        error?: string;
      };

      if (!response.ok || !data.code) {
        throw new Error(data.error || t.aiErrorGeneric);
      }

      const cleanFilename = (data.filename || activeFile?.path || 'generated.html')
        .trim()
        .replace(/^\/+/, '');

      setResult({
        explanation: data.explanation || '',
        filename: cleanFilename,
        code: data.code,
      });
      setTargetFilename(cleanFilename);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.aiErrorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.code) return;
    try {
      await navigator.clipboard.writeText(result.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div
      dir={locale === 'ku' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-xs md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl md:rounded-xl dark:border-[#30363D] dark:bg-[#161B22]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3.5 md:px-5 dark:border-[#262C36]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.aiTitle}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-[#8B949E]">
                {t.aiSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-[#8B949E] dark:hover:bg-[#1C2128] dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
          {/* Quick Starter Prompts */}
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={loading}
                onClick={() => {
                  setPrompt(item.text);
                  handleGenerate(item.text);
                }}
                className="inline-flex min-h-[34px] items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-600 disabled:opacity-50 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3] dark:hover:border-blue-400/50 dark:hover:text-blue-400"
              >
                <Sparkles className="h-3 w-3 shrink-0 text-blue-500" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Prompt Input */}
          <div className="space-y-2.5">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder={t.aiPromptPlaceholder}
              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3] dark:placeholder:text-[#6E7681]"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              {activeFile ? (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-[#8B949E]">
                  <input
                    type="checkbox"
                    checked={includeContext}
                    onChange={(e) => setIncludeContext(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{t.aiIncludeContext}</span>
                  <span
                    dir="ltr"
                    className="rounded bg-slate-100 px-1.5 py-0.5 font-mono-code text-[11px] text-slate-700 dark:bg-[#0D1117] dark:text-[#E6EDF3]"
                  >
                    {activeFile.path}
                  </span>
                </label>
              ) : (
                <span />
              )}

              <button
                type="button"
                disabled={loading || !prompt.trim()}
                onClick={() => handleGenerate()}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t.aiGenerating}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>{t.aiGenerate}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* Generated Output */}
          {result && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-[#F6F8FA] p-3.5 dark:border-[#30363D] dark:bg-[#0D1117]">
              {result.explanation && (
                <p className="text-xs leading-relaxed text-slate-700 dark:text-[#E6EDF3]">
                  {result.explanation}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-y border-slate-200 py-2 dark:border-[#262C36]">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-[#8B949E] whitespace-nowrap">
                    {t.aiSuggestedFile}:
                  </span>
                  <input
                    type="text"
                    dir="ltr"
                    value={targetFilename}
                    onChange={(e) => setTargetFilename(e.target.value)}
                    className="min-w-[140px] flex-1 rounded border border-slate-300 bg-white px-2 py-1 font-mono-code text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-[#30363D] dark:bg-[#161B22] dark:text-[#E6EDF3]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-[#30363D] dark:bg-[#161B22] dark:text-[#E6EDF3] dark:hover:bg-[#1C2128]"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copied ? t.copied : t.copy}</span>
                </button>
              </div>

              <pre
                dir="ltr"
                className="max-h-64 overflow-auto rounded-md border border-slate-200 bg-white p-3 font-mono-code text-xs leading-relaxed text-slate-800 dark:border-[#262C36] dark:bg-[#161B22] dark:text-[#E6EDF3]"
              >
                <code>{result.code}</code>
              </pre>

              {/* Apply Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const cleanName = targetFilename.trim() || result.filename || 'generated.html';
                    onCreateNewFile(cleanName, result.code);
                    onClose();
                  }}
                  className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 whitespace-nowrap"
                >
                  <FilePlus2 className="h-4 w-4 shrink-0" />
                  <span>{t.aiCreateNewFile}</span>
                </button>

                {activeFile && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onReplaceActiveFile(result.code);
                        onClose();
                      }}
                      className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 whitespace-nowrap"
                    >
                      <Replace className="h-4 w-4 shrink-0" />
                      <span>{t.aiReplaceFile}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onInsertAtCursor(result.code);
                        onClose();
                      }}
                      className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-[#30363D] dark:bg-[#161B22] dark:text-[#E6EDF3] dark:hover:bg-[#1C2128] whitespace-nowrap"
                    >
                      <TextCursorInput className="h-4 w-4 shrink-0" />
                      <span>{t.aiInsertCursor}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
