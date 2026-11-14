import { useEffect } from 'react';
import {
  Check,
  Copy,
  Download,
  Eraser,
  FolderArchive,
  Keyboard,
  Moon,
  Search,
  Sparkles,
  Sun,
  Upload,
  WrapText,
  X,
} from 'lucide-react';
import type { Translations } from '../i18n/translations';
import type { UiLocale } from '../types/workspace';
import { PWAInstallButton } from './PWAInstallButton';

interface MobileToolsSheetProps {
  open: boolean;
  t: Translations;
  locale: UiLocale;
  theme: 'dark' | 'light';
  wordWrap: boolean;
  fontSize: number;
  autoRun: boolean;
  showQuickBar: boolean;
  copiedFlag: boolean;
  hasActiveFile: boolean;
  onClose: () => void;
  onFormat: () => void;
  onFind: () => void;
  onCopy: () => void;
  onDownloadFile: () => void;
  onExportZip: () => void;
  onUploadFile: () => void;
  onClearCode: () => void;
  onChangeFontSize: (delta: number) => void;
  onToggleWrap: () => void;
  onToggleAutoRun: () => void;
  onToggleQuickBar: () => void;
  onToggleTheme: () => void;
  onToggleLocale: () => void;
}

export function MobileToolsSheet({
  open,
  t,
  locale,
  theme,
  wordWrap,
  fontSize,
  autoRun,
  showQuickBar,
  copiedFlag,
  hasActiveFile,
  onClose,
  onFormat,
  onFind,
  onCopy,
  onDownloadFile,
  onExportZip,
  onUploadFile,
  onClearCode,
  onChangeFontSize,
  onToggleWrap,
  onToggleAutoRun,
  onToggleQuickBar,
  onToggleTheme,
  onToggleLocale,
}: MobileToolsSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const runAndClose = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/55 backdrop-blur-xs md:hidden"
      onClick={onClose}
    >
      <div
        dir={locale === 'ku' ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-3xl border-t border-slate-200 bg-white px-4 pt-2 pb-6 shadow-2xl dark:border-[#30363D] dark:bg-[#161B22]"
      >
        {/* Drag handle */}
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-[#30363D]" />

        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-[#E6EDF3]">
            {t.moreActions}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 active:bg-slate-100 dark:text-[#8B949E] dark:active:bg-[#262C36]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-2 overflow-y-auto">
          {hasActiveFile && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => runAndClose(onFormat)}
                className="flex min-h-[46px] items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-800 active:bg-slate-200 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3]"
              >
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span>{t.format}</span>
              </button>

              <button
                type="button"
                onClick={() => runAndClose(onFind)}
                className="flex min-h-[46px] items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-800 active:bg-slate-200 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3]"
              >
                <Search className="h-4 w-4 text-blue-500" />
                <span>{t.findInFile}</span>
              </button>

              <button
                type="button"
                onClick={() => runAndClose(onCopy)}
                className="flex min-h-[46px] items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-800 active:bg-slate-200 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3]"
              >
                {copiedFlag ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-500" />
                )}
                <span>{copiedFlag ? t.copied : t.copy}</span>
              </button>

              <button
                type="button"
                onClick={() => runAndClose(onDownloadFile)}
                className="flex min-h-[46px] items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-800 active:bg-slate-200 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3]"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>{t.downloadFile}</span>
              </button>

              <button
                type="button"
                onClick={() => runAndClose(onClearCode)}
                className="flex min-h-[46px] items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/8 px-3.5 text-xs font-semibold text-red-600 active:bg-red-500/15 dark:text-red-400"
              >
                <Eraser className="h-4 w-4" />
                <span>{t.clearCode}</span>
              </button>

              <button
                type="button"
                onClick={() => runAndClose(onUploadFile)}
                className="flex min-h-[46px] items-center gap-2.5 rounded-xl border border-blue-500/30 bg-blue-500/8 px-3.5 text-xs font-semibold text-blue-600 active:bg-blue-500/15 dark:text-blue-400"
              >
                <Upload className="h-4 w-4" />
                <span>{t.uploadFile}</span>
              </button>
            </div>
          )}

          {!hasActiveFile && (
            <button
              type="button"
              onClick={() => runAndClose(onUploadFile)}
              className="flex min-h-[46px] w-full items-center gap-2.5 rounded-xl border border-blue-500/30 bg-blue-500/8 px-3.5 text-xs font-semibold text-blue-600 active:bg-blue-500/15 dark:text-blue-400"
            >
              <Upload className="h-4 w-4" />
              <span>{t.uploadFile}</span>
            </button>
          )}

          <PWAInstallButton t={t} locale={locale} variant="sheet" />

          <button
            type="button"
            onClick={() => runAndClose(onExportZip)}
            className="flex min-h-[46px] w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-800 active:bg-slate-200 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3]"
          >
            <span className="flex items-center gap-2.5">
              <FolderArchive className="h-4 w-4 text-blue-500" />
              <span>{t.exportZip}</span>
            </span>
          </button>

          {/* Font size & toggles */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex min-h-[46px] items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-[#30363D] dark:bg-[#0D1117]">
              <button
                type="button"
                onClick={() => onChangeFontSize(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-slate-700 active:bg-slate-200 dark:text-[#E6EDF3] dark:active:bg-[#262C36]"
              >
                A-
              </button>
              <span className="font-mono-code text-xs tabular-nums text-slate-600 dark:text-[#8B949E]">
                {fontSize}px
              </span>
              <button
                type="button"
                onClick={() => onChangeFontSize(1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-slate-700 active:bg-slate-200 dark:text-[#E6EDF3] dark:active:bg-[#262C36]"
              >
                A+
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleWrap}
              className={`flex min-h-[46px] items-center justify-between rounded-xl border px-3.5 text-xs font-medium ${
                wordWrap
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3]'
              }`}
            >
              <span className="flex items-center gap-2">
                <WrapText className="h-4 w-4" />
                <span>{t.wrap}</span>
              </span>
              <span>{wordWrap ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleQuickBar}
              className={`flex min-h-[46px] items-center justify-between rounded-xl border px-3.5 text-xs font-medium ${
                showQuickBar
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                <span>{t.quickBar}</span>
              </span>
              <span>{showQuickBar ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleAutoRun}
              className={`flex min-h-[46px] items-center justify-between rounded-xl border px-3.5 text-xs font-medium ${
                autoRun
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3]'
              }`}
            >
              <span>{t.autoRun}</span>
              <span>{autoRun ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              className="flex min-h-[46px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-800 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3]"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
              <span>{theme === 'dark' ? t.lightMode : t.darkMode}</span>
            </button>

            <button
              type="button"
              onClick={onToggleLocale}
              className="flex min-h-[46px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-800 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3]"
            >
              {locale === 'en' ? 'کوردی' : 'English'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
