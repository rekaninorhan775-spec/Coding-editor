import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PROJECT_TEMPLATES, type ProjectTemplate } from '../data/templates';
import type { Translations } from '../i18n/translations';

interface NewProjectModalProps {
  open: boolean;
  t: Translations;
  locale: 'en' | 'ku';
  onClose: () => void;
  onCreate: (template: ProjectTemplate, name: string) => void;
}

export function NewProjectModal({
  open,
  t,
  locale,
  onClose,
  onCreate,
}: NewProjectModalProps) {
  const [selectedId, setSelectedId] = useState(PROJECT_TEMPLATES[0].id);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setSelectedId(PROJECT_TEMPLATES[0].id);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const selectedTemplate =
    PROJECT_TEMPLATES.find((tpl) => tpl.id === selectedId) ?? PROJECT_TEMPLATES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultLabel = locale === 'ku' ? selectedTemplate.nameKu : selectedTemplate.name;
    onCreate(selectedTemplate, name.trim() || defaultLabel);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        dir={locale === 'ku' ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-[#30363D] dark:bg-[#161B22]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-[#E6EDF3]">
            {t.newProject}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#1C2128] dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-[#8B949E]">
              {t.projectName}
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={locale === 'ku' ? selectedTemplate.nameKu : selectedTemplate.name}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3]"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-medium text-slate-700 dark:text-[#8B949E]">
              {t.chooseTemplate}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PROJECT_TEMPLATES.map((tpl) => {
                const active = tpl.id === selectedId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedId(tpl.id)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      active
                        ? 'border-blue-500 bg-blue-500/8 dark:bg-blue-500/12'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-[#30363D] dark:bg-[#0D1117] dark:hover:border-[#444C56]'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-[#E6EDF3]">
                      {locale === 'ku' ? tpl.nameKu : tpl.name}
                    </div>
                    <div className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-[#8B949E]">
                      {locale === 'ku' ? tpl.descriptionKu : tpl.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-[#30363D] dark:text-[#E6EDF3] dark:hover:bg-[#1C2128]"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500"
            >
              {t.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
