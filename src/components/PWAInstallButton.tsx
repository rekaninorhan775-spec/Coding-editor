import { useState } from 'react';
import { Check, Copy, Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { Translations } from '../i18n/translations';
import type { UiLocale } from '../types/workspace';

interface PWAInstallButtonProps {
  t: Translations;
  locale: UiLocale;
  variant?: 'toolbar' | 'sheet';
}

export function PWAInstallButton({
  t,
  locale,
  variant = 'toolbar',
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) return;
    }
    setShowGuide(true);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1600);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        className={
          variant === 'sheet'
            ? 'flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white active:bg-blue-500'
            : 'inline-flex items-center gap-1.5 rounded-md border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/15 dark:text-blue-400 whitespace-nowrap shrink-0'
        }
      >
        <Download className="h-3.5 w-3.5" />
        <span>{t.installApp}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            dir={locale === 'ku' ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-[#30363D] dark:bg-[#161B22]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icon.svg"
                  alt="Coding Editor"
                  className="h-7 w-7 rounded-lg"
                />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#E6EDF3]">
                  Coding Editor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label={t.close}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#1C2128] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-[#8B949E]">
              {t.installNote}
            </p>

            <div className="mt-4 space-y-3">
              {/* Android */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-[#30363D] dark:bg-[#0D1117]">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-[#E6EDF3]">
                  <Smartphone className="h-4 w-4 text-emerald-500" />
                  <span>{t.androidInstallTitle}</span>
                </div>
                <ol className="mt-2 space-y-1 text-xs text-slate-600 dark:text-[#8B949E]">
                  <li>1. {t.androidInstallStep1}</li>
                  <li>2. {t.androidInstallStep2}</li>
                  <li>3. {t.androidInstallStep3}</li>
                </ol>
              </div>

              {/* iOS */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-[#30363D] dark:bg-[#0D1117]">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-[#E6EDF3]">
                  <Smartphone className="h-4 w-4 text-blue-500" />
                  <span>{t.iosInstallTitle}</span>
                </div>
                <ol className="mt-2 space-y-1 text-xs text-slate-600 dark:text-[#8B949E]">
                  <li>1. {t.iosInstallStep1}</li>
                  <li>2. {t.iosInstallStep2}</li>
                </ol>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleCopyUrl()}
                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3] dark:hover:bg-[#1C2128]"
              >
                {copiedLink ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedLink ? t.copied : t.copyAppLink}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[42px] rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
