import { useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FilePlus,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { CodeFile, CodeProject } from '../types/workspace';
import type { Translations } from '../i18n/translations';
import { detectLanguageFromPath, getFileBadgeColor, getFileShortTag } from '../utils/language';

interface FileSidebarProps {
  projects: CodeProject[];
  activeProject: CodeProject;
  activeFileId: string;
  t: Translations;
  locale: 'en' | 'ku';
  onSelectProject: (projectId: string) => void;
  onOpenNewProjectModal: () => void;
  onDeleteProject: (projectId: string) => void;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (path: string) => void;
  onRenameFile: (fileId: string, newPath: string) => void;
  onDuplicateFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onImportFiles: (files: Array<{ path: string; content: string }>) => void;
  onCloseMobileDrawer?: () => void;
}

interface TreeNode {
  name: string;
  fullPath: string;
  isFolder: boolean;
  file?: CodeFile;
  children: TreeNode[];
}

function buildFileTree(files: CodeFile[], extraFolders: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  const ensureFolder = (parts: string[], parentChildren: TreeNode[], prefix = ''): TreeNode[] => {
    if (parts.length === 0) return parentChildren;
    const [head, ...rest] = parts;
    const fullPath = prefix ? `${prefix}/${head}` : head;
    let node = parentChildren.find((n) => n.isFolder && n.name === head);
    if (!node) {
      node = { name: head, fullPath, isFolder: true, children: [] };
      parentChildren.push(node);
    }
    return ensureFolder(rest, node.children, fullPath);
  };

  for (const folder of extraFolders) {
    const clean = folder.replace(/^\/+|\/+$/g, '');
    if (clean) {
      ensureFolder(clean.split('/'), root);
    }
  }

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    if (parts.length === 0) continue;
    const fileName = parts[parts.length - 1];
    const folderParts = parts.slice(0, -1);
    const targetList = ensureFolder(folderParts, root);
    targetList.push({
      name: fileName,
      fullPath: file.path,
      isFolder: false,
      file,
      children: [],
    });
  }

  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.isFolder) sortNodes(node.children);
    }
    return nodes;
  };

  return sortNodes(root);
}

export function FileSidebar({
  projects,
  activeProject,
  activeFileId,
  t,
  locale,
  onSelectProject,
  onOpenNewProjectModal,
  onDeleteProject,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDuplicateFile,
  onDeleteFile,
  onImportFiles,
  onCloseMobileDrawer,
}: FileSidebarProps) {
  const [sidebarTab, setSidebarTab] = useState<'files' | 'search'>('files');
  const [filterText, setFilterText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [extraFolders, setExtraFolders] = useState<string[]>([]);

  const [creatingMode, setCreatingMode] = useState<'file' | 'folder' | null>(null);
  const [newPathInput, setNewPathInput] = useState('');
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const fileUploadRef = useRef<HTMLInputElement | null>(null);

  const filteredFiles = useMemo(() => {
    if (!filterText.trim()) return activeProject.files;
    const q = filterText.trim().toLowerCase();
    return activeProject.files.filter((f) => f.path.toLowerCase().includes(q));
  }, [activeProject.files, filterText]);

  const fileTree = useMemo(
    () => buildFileTree(filteredFiles, filterText.trim() ? [] : extraFolders),
    [filteredFiles, extraFolders, filterText]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{ file: CodeFile; matches: Array<{ lineNum: number; preview: string }> }> = [];

    for (const file of activeProject.files) {
      const lines = file.content.split('\n');
      const matches: Array<{ lineNum: number; preview: string }> = [];
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(q)) {
          matches.push({ lineNum: idx + 1, preview: line.trim() });
        }
      });
      if (matches.length > 0 || file.path.toLowerCase().includes(q)) {
        results.push({ file, matches: matches.slice(0, 8) });
      }
    }
    return results;
  }, [activeProject.files, searchQuery]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: prev[folderPath] === false ? true : false,
    }));
  };

  const isFolderOpen = (folderPath: string) => expandedFolders[folderPath] !== false;

  const handleStartCreate = (mode: 'file' | 'folder', prefix = '') => {
    setSidebarTab('files');
    setCreatingMode(mode);
    setNewPathInput(prefix);
  };

  const handleConfirmCreate = () => {
    const clean = newPathInput.trim().replace(/^\/+|\/+$/g, '');
    if (!clean) {
      setCreatingMode(null);
      return;
    }

    if (creatingMode === 'folder') {
      setExtraFolders((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
      setExpandedFolders((prev) => ({ ...prev, [clean]: true }));
      setCreatingMode(null);
      setNewPathInput('');
      return;
    }

    if (creatingMode === 'file') {
      onCreateFile(clean);
      const parts = clean.split('/');
      if (parts.length > 1) {
        const parent = parts.slice(0, -1).join('/');
        setExpandedFolders((prev) => ({ ...prev, [parent]: true }));
      }
      setCreatingMode(null);
      setNewPathInput('');
    }
  };

  const handleConfirmRename = (fileId: string) => {
    const clean = renameInput.trim().replace(/^\/+|\/+$/g, '');
    if (clean) {
      onRenameFile(fileId, clean);
    }
    setRenamingFileId(null);
    setRenameInput('');
  };

  const handleUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const imported: Array<{ path: string; content: string }> = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      const text = await f.text();
      imported.push({ path: f.name, content: text });
    }
    onImportFiles(imported);
    e.target.value = '';
  };

  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      if (node.isFolder) {
        const open = isFolderOpen(node.fullPath);
        return (
          <div key={`folder:${node.fullPath}`}>
            <div
              className="group flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-200/70 dark:text-[#8B949E] dark:hover:bg-[#1C2128]"
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
              <button
                type="button"
                onClick={() => toggleFolder(node.fullPath)}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
              >
                {open ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                )}
                {open ? (
                  <FolderOpen className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                ) : (
                  <Folder className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                )}
                <span className="truncate font-medium text-slate-700 dark:text-[#E6EDF3]">
                  {node.name}
                </span>
              </button>
              <button
                type="button"
                title={t.newFile}
                onClick={() => handleStartCreate('file', `${node.fullPath}/`)}
                className="rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-300/60 hover:text-slate-700 group-hover:opacity-100 dark:hover:bg-[#30363D] dark:hover:text-white"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            {open && <div>{renderTree(node.children, depth + 1)}</div>}
          </div>
        );
      }

      const file = node.file!;
      const isActive = file.id === activeFileId;
      const isRenaming = renamingFileId === file.id;
      const lang = detectLanguageFromPath(file.path);
      const badgeColor = getFileBadgeColor(lang);
      const shortTag = getFileShortTag(file.path);

      if (isRenaming) {
        return (
          <div
            key={file.id}
            className="px-2 py-1"
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
          >
            <input
              type="text"
              autoFocus
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmRename(file.id);
                if (e.key === 'Escape') setRenamingFileId(null);
              }}
              onBlur={() => handleConfirmRename(file.id)}
              dir="ltr"
              className="w-full rounded border border-blue-500 bg-white px-2 py-1 font-mono-code text-xs text-slate-900 outline-none dark:bg-[#0D1117] dark:text-[#E6EDF3]"
            />
          </div>
        );
      }

      return (
        <div
          key={file.id}
          className={`group flex min-h-[44px] items-center justify-between rounded-md pr-1.5 transition-colors md:min-h-0 ${
            isActive
              ? 'bg-blue-500/12 text-slate-900 dark:bg-blue-500/15 dark:text-white'
              : 'text-slate-600 hover:bg-slate-200/60 dark:text-[#8B949E] dark:hover:bg-[#1C2128]'
          }`}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
        >
          <button
            type="button"
            onClick={() => {
              onSelectFile(file.id);
              onCloseMobileDrawer?.();
            }}
            className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 py-1.5 text-left md:min-h-0"
          >
            <span className={`w-5 shrink-0 font-mono-code text-[10px] font-semibold ${badgeColor}`}>
              {shortTag}
            </span>
            <span dir="ltr" className="truncate text-[13px] font-medium">
              {node.name}
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
            <button
              type="button"
              title={t.rename}
              onClick={(e) => {
                e.stopPropagation();
                setRenamingFileId(file.id);
                setRenameInput(file.path);
              }}
              className="flex h-9 w-9 items-center justify-center rounded text-slate-400 hover:bg-slate-300/60 hover:text-slate-700 md:h-auto md:w-auto md:p-1 dark:hover:bg-[#30363D] dark:hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5 md:h-3 md:w-3" />
            </button>
            <button
              type="button"
              title={t.duplicate}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateFile(file.id);
              }}
              className="flex h-9 w-9 items-center justify-center rounded text-slate-400 hover:bg-slate-300/60 hover:text-slate-700 md:h-auto md:w-auto md:p-1 dark:hover:bg-[#30363D] dark:hover:text-white"
            >
              <Copy className="h-3.5 w-3.5 md:h-3 md:w-3" />
            </button>
            {activeProject.files.length > 1 && (
              <button
                type="button"
                title={t.delete}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFile(file.id);
                }}
                className="flex h-9 w-9 items-center justify-center rounded text-slate-400 hover:bg-red-500/15 hover:text-red-500 md:h-auto md:w-auto md:p-1"
              >
                <Trash2 className="h-3.5 w-3.5 md:h-3 md:w-3" />
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <aside
      dir={locale === 'ku' ? 'rtl' : 'ltr'}
      className="flex h-full w-[85vw] max-w-[300px] shrink-0 flex-col border-r border-slate-200 bg-[#F6F8FA] pt-[max(env(safe-area-inset-top),8px)] md:w-[264px] md:pt-0 dark:border-[#262C36] dark:bg-[#161B22]"
    >
      {/* Project Switcher */}
      <div className="border-b border-slate-200 p-3 dark:border-[#262C36]">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-[#8B949E]">
            {t.projects}
          </span>
          <div className="flex items-center gap-1">
            {projects.length > 1 && (
              <button
                type="button"
                title={t.deleteProject}
                onClick={() => onDeleteProject(activeProject.id)}
                className="flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-colors hover:bg-red-500/15 hover:text-red-500 md:h-auto md:w-auto md:p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              title={t.newProject}
              onClick={onOpenNewProjectModal}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/10 dark:text-blue-400 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.newProject}</span>
            </button>
            {onCloseMobileDrawer && (
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                aria-label={t.close}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/70 md:hidden dark:text-[#8B949E] dark:hover:bg-[#1C2128]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <select
          value={activeProject.id}
          onChange={(e) => onSelectProject(e.target.value)}
          aria-label={t.projects}
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3]"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mode Switcher: Explorer / Search */}
      <div className="flex items-center gap-1 border-b border-slate-200 px-3 py-2 dark:border-[#262C36]">
        <button
          type="button"
          onClick={() => setSidebarTab('files')}
          className={`flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            sidebarTab === 'files'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1C2128] dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-[#8B949E] dark:hover:text-white'
          }`}
        >
          {t.files}
        </button>
        <button
          type="button"
          onClick={() => setSidebarTab('search')}
          className={`flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            sidebarTab === 'search'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1C2128] dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-[#8B949E] dark:hover:text-white'
          }`}
        >
          {t.search}
        </button>
      </div>

      {sidebarTab === 'files' ? (
        <>
          {/* File Action Strip */}
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-[#262C36]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStartCreate('file')}
                title={t.newFile}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/70 dark:text-[#E6EDF3] dark:hover:bg-[#1C2128] whitespace-nowrap shrink-0"
              >
                <FilePlus className="h-3.5 w-3.5 text-blue-500" />
                <span>{t.newFile}</span>
              </button>
              <button
                type="button"
                onClick={() => handleStartCreate('folder')}
                title={t.newFolder}
                className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-[#8B949E] dark:hover:bg-[#1C2128] dark:hover:text-white"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => fileUploadRef.current?.click()}
                title={t.uploadFiles}
                className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-[#8B949E] dark:hover:bg-[#1C2128] dark:hover:text-white"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileUploadRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleUploadChange}
              />
            </div>
            <span className="font-mono-code text-[11px] tabular-nums text-slate-400 dark:text-[#6E7681]">
              {activeProject.files.length}
            </span>
          </div>

          {/* Filter Input */}
          <div className="px-3 pt-2.5 pb-1">
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t.filterFilesPlaceholder}
              className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3] dark:placeholder:text-[#6E7681]"
            />
          </div>

          {/* Inline New File / Folder Input */}
          {creatingMode && (
            <div className="mx-3 mt-1.5 rounded-md border border-blue-500 bg-white p-2 dark:bg-[#0D1117]">
              <div className="mb-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                {creatingMode === 'file' ? t.newFile : t.newFolder}
              </div>
              <input
                type="text"
                autoFocus
                dir="ltr"
                value={newPathInput}
                onChange={(e) => setNewPathInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmCreate();
                  if (e.key === 'Escape') {
                    setCreatingMode(null);
                    setNewPathInput('');
                  }
                }}
                placeholder={
                  creatingMode === 'file' ? t.fileNamePlaceholder : t.folderNamePlaceholder
                }
                className="w-full bg-transparent font-mono-code text-xs text-slate-900 placeholder:text-slate-400 outline-none dark:text-[#E6EDF3]"
              />
              <div className="mt-2 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCreatingMode(null);
                    setNewPathInput('');
                  }}
                  className="rounded px-2 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1C2128]"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCreate}
                  className="rounded bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-blue-500"
                >
                  {t.create}
                </button>
              </div>
            </div>
          )}

          {/* File Tree */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {fileTree.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-slate-400 dark:text-[#6E7681]">
                {t.noFilesFound}
              </p>
            ) : (
              renderTree(fileTree)
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-2 left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pr-2.5 pl-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#E6EDF3]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {searchQuery.trim() && searchResults.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-slate-400 dark:text-[#6E7681]">
                {t.noFilesFound}
              </p>
            )}
            {searchResults.map(({ file, matches }) => (
              <div key={file.id} className="mb-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectFile(file.id);
                    onCloseMobileDrawer?.();
                  }}
                  className="flex min-h-[40px] w-full items-center justify-between rounded px-2 py-1 text-left text-xs font-semibold text-slate-800 hover:bg-slate-200/70 md:min-h-0 dark:text-[#E6EDF3] dark:hover:bg-[#1C2128]"
                >
                  <span dir="ltr" className="truncate">
                    {file.path}
                  </span>
                  <span className="ml-2 shrink-0 font-mono-code text-[10px] tabular-nums text-slate-400">
                    {matches.length}
                  </span>
                </button>
                <div className="mt-0.5 space-y-0.5 pl-3">
                  {matches.map((m) => (
                    <button
                      key={`${file.id}:${m.lineNum}`}
                      type="button"
                      onClick={() => {
                        onSelectFile(file.id);
                        onCloseMobileDrawer?.();
                      }}
                      dir="ltr"
                      className="flex min-h-[36px] w-full items-center gap-2 rounded px-2 py-1 text-left font-mono-code text-[11px] text-slate-500 hover:bg-slate-200/60 md:min-h-0 dark:text-[#8B949E] dark:hover:bg-[#1C2128]"
                    >
                      <span className="shrink-0 tabular-nums text-slate-400">{m.lineNum}:</span>
                      <span className="truncate">{m.preview}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
