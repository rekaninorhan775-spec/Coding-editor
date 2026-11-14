import { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
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
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (variant === 'sheet') {
      return (
        <button
          type="button"
          onClick={() => void install()}
          className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white active:bg-blue-500"
        >
          <Download className="h-4 w-4" />
          <span>{t.installApp}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/15 dark:text-blue-400 whitespace-nowrap shrink-0"
      >
        <Download className="h-3.5 w-3.5" />
        <span>{t.installApp}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            variant === 'sheet'
              ? 'flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white active:bg-blue-500'
              : 'inline-flex items-center gap-1.5 rounded-md border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/15 dark:text-blue-400 whitespace-nowrap shrink-0'
          }
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>{t.installOnIOS}</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              dir={locale === 'ku' ? 'rtl' : 'ltr'}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-[#30363D] dark:bg-[#161B22]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#E6EDF3]">
                  {t.iosInstallTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label={t.close}
                  className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-[#8B949E]">
                <li>1. {t.iosInstallStep1}</li>
                <li>2. {t.iosInstallStep2}</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                {t.close}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
