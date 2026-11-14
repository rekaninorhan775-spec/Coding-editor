export type EditorLanguage =
  | 'html'
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'json'
  | 'markdown'
  | 'python'
  | 'plaintext';

export interface CodeFile {
  id: string;
  path: string; // e.g. "index.html" or "src/app.js"
  content: string;
  updatedAt: number;
}

export interface CodeProject {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  files: CodeFile[];
  activeFileId: string;
  openFileIds: string[];
}

export type ViewMode = 'split' | 'code' | 'preview';

export type PreviewViewport = 'desktop' | 'tablet' | 'mobile';

export type UiLocale = 'en' | 'ku';

export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'result';

export interface ConsoleEntry {
  id: string;
  level: ConsoleLevel;
  messages: string[];
  timestamp: string;
}

export interface CursorStats {
  line: number;
  col: number;
  lines: number;
  length: number;
  selectionLength: number;
}
