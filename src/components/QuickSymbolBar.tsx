import { Eraser, Redo2, Search, Undo2, Upload } from 'lucide-react';
import type { Translations } from '../i18n/translations';

interface QuickSymbolBarProps {
  t: Translations;
  onInsert: (text: string, cursorOffset?: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onFind: () => void;
  onClear: () => void;
  onUpload: () => void;
}

const SYMBOLS = [
  { label: 'Tab', value: '  ' },
  { label: '{', value: '{' },
  { label: '}', value: '}' },
  { label: '(', value: '(' },
  { label: ')', value: ')' },
  { label: '[', value: '[' },
  { label: ']', value: ']' },
  { label: '<', value: '<' },
  { label: '>', value: '>' },
  { label: ';', value: ';' },
  { label: ':', value: ':' },
  { label: '"', value: '"' },
  { label: "'", value: "'" },
  { label: '=', value: '=' },
  { label: '/', value: '/' },
  { label: '=>', value: ' => ' },
  { label: '$', value: '$' },
  { label: '!', value: '!' },
  { label: '&', value: '&' },
  { label: '|', value: '|' },
  { label: '.', value: '.' },
  { label: ',', value: ',' },
  { label: '_', value: '_' },
];

export function QuickSymbolBar({
  t,
  onInsert,
  onUndo,
  onRedo,
  onFind,
  onClear,
  onUpload,
}: QuickSymbolBarProps) {
  return (
    <div
      dir="ltr"
      className="flex h-11 shrink-0 items-center border-t border-slate-200 bg-[#F6F8FA] dark:border-[#262C36] dark:bg-[#161B22]"
    >
      {/* Fixed quick edit controls: Undo, Redo, Find, Clear, Upload */}
      <div className="flex shrink-0 items-center border-r border-slate-200 px-1 dark:border-[#262C36]">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onUndo}
          title={t.undo}
          aria-label={t.undo}
          className="flex h-10 min-w-[36px] items-center justify-center rounded-md text-slate-700 active:bg-slate-200 dark:text-[#E6EDF3] dark:active:bg-[#262C36]"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onRedo}
          title={t.redo}
          aria-label={t.redo}
          className="flex h-10 min-w-[36px] items-center justify-center rounded-md text-slate-700 active:bg-slate-200 dark:text-[#E6EDF3] dark:active:bg-[#262C36]"
        >
          <Redo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onFind}
          title={t.findInFile}
          aria-label={t.findInFile}
          className="flex h-10 min-w-[36px] items-center justify-center rounded-md text-slate-700 active:bg-slate-200 dark:text-[#E6EDF3] dark:active:bg-[#262C36]"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onUpload}
          title={t.uploadFile}
          aria-label={t.uploadFile}
          className="flex h-10 min-w-[36px] items-center justify-center rounded-md text-blue-600 active:bg-blue-500/15 dark:text-blue-400 dark:active:bg-blue-500/20"
        >
          <Upload className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClear}
          title={t.clearCode}
          aria-label={t.clearCode}
          className="flex h-10 min-w-[36px] items-center justify-center rounded-md text-red-600 active:bg-red-500/15 dark:text-red-400 dark:active:bg-red-500/20"
        >
          <Eraser className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable QuickEdit symbol keys */}
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SYMBOLS.map((sym) => (
          <button
            key={sym.label}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onInsert(sym.value)}
            className="flex h-9 min-w-[38px] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 font-mono-code text-xs font-medium text-slate-800 active:scale-95 active:bg-blue-500/15 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3] dark:active:bg-blue-500/20"
          >
            {sym.label}
          </button>
        ))}
      </div>
    </div>
  );
}
