import type { UiLocale } from '../types/workspace';

export interface Translations {
  appName: string;
  files: string;
  search: string;
  newFile: string;
  newFolder: string;
  newProject: string;
  uploadFiles: string;
  run: string;
  exportZip: string;
  downloadFile: string;
  format: string;
  wrap: string;
  copy: string;
  copied: string;
  splitView: string;
  codeView: string;
  previewView: string;
  preview: string;
  console: string;
  clear: string;
  reload: string;
  desktop: string;
  tablet: string;
  mobile: string;
  rename: string;
  duplicate: string;
  delete: string;
  cancel: string;
  create: string;
  save: string;
  saved: string;
  projectName: string;
  chooseTemplate: string;
  searchPlaceholder: string;
  filterFilesPlaceholder: string;
  noFilesFound: string;
  noOpenFiles: string;
  createFirstFile: string;
  consolePlaceholder: string;
  noConsoleOutput: string;
  validJson: string;
  invalidJson: string;
  pythonNote: string;
  plainTextNote: string;
  fileNamePlaceholder: string;
  folderNamePlaceholder: string;
  deleteProject: string;
  projects: string;
  autoRun: string;
  lineCol: (line: number, col: number) => string;
  linesCount: (count: number) => string;
  matchCount: (count: number) => string;
  toggleSidebar: string;
  darkMode: string;
  lightMode: string;
  undo: string;
  redo: string;
  findInFile: string;
  moreActions: string;
  quickBar: string;
  close: string;
  uploadFile: string;
  clearCode: string;
  installApp: string;
  installOnIOS: string;
  iosInstallTitle: string;
  iosInstallStep1: string;
  iosInstallStep2: string;
  offlineMode: string;
}

export const TRANSLATIONS: Record<UiLocale, Translations> = {
  en: {
    appName: 'Coding Editor',
    files: 'Explorer',
    search: 'Search',
    newFile: 'New File',
    newFolder: 'New Folder',
    newProject: 'New Project',
    uploadFiles: 'Import Files',
    run: 'Run',
    exportZip: 'Export ZIP',
    downloadFile: 'Download',
    format: 'Format',
    wrap: 'Wrap',
    copy: 'Copy',
    copied: 'Copied',
    splitView: 'Split',
    codeView: 'Code',
    previewView: 'Preview',
    preview: 'Preview',
    console: 'Console',
    clear: 'Clear',
    reload: 'Reload',
    desktop: 'Desktop',
    tablet: 'Tablet',
    mobile: 'Mobile',
    rename: 'Rename',
    duplicate: 'Duplicate',
    delete: 'Delete',
    cancel: 'Cancel',
    create: 'Create',
    save: 'Save',
    saved: 'Saved',
    projectName: 'Project name',
    chooseTemplate: 'Choose a starter template',
    searchPlaceholder: 'Search across all files...',
    filterFilesPlaceholder: 'Filter files...',
    noFilesFound: 'No matching files found.',
    noOpenFiles: 'Select a file from the explorer or create a new one to start coding.',
    createFirstFile: 'Create File',
    consolePlaceholder: 'Evaluate JavaScript expression...',
    noConsoleOutput: 'Console output from your code will appear here.',
    validJson: 'Valid JSON',
    invalidJson: 'Syntax Error',
    pythonNote: 'Python syntax editing and export are enabled. Live browser execution runs HTML, CSS, JavaScript, Markdown, and JSON.',
    plainTextNote: 'Plain text file ready for editing and export.',
    fileNamePlaceholder: 'e.g. src/helper.js',
    folderNamePlaceholder: 'e.g. components',
    deleteProject: 'Delete Project',
    projects: 'Projects',
    autoRun: 'Auto-run',
    lineCol: (line, col) => `Ln ${line}, Col ${col}`,
    linesCount: (count) => `${count} lines`,
    matchCount: (count) => `${count} matches`,
    toggleSidebar: 'Sidebar',
    darkMode: 'Dark',
    lightMode: 'Light',
    undo: 'Undo',
    redo: 'Redo',
    findInFile: 'Find & Replace',
    moreActions: 'Tools',
    quickBar: 'Quick Keys',
    close: 'Close',
    uploadFile: 'Upload File',
    clearCode: 'Clear Code',
    installApp: 'Install App',
    installOnIOS: 'Install App',
    iosInstallTitle: 'Install Coding Editor',
    iosInstallStep1: 'Tap the Share button in Safari.',
    iosInstallStep2: 'Scroll down and tap Add to Home Screen.',
    offlineMode: 'Offline Mode — Changes saved locally.',
  },
  ku: {
    appName: 'Coding Editor',
    files: 'فایلەکان',
    search: 'گەڕان',
    newFile: 'فایلی نوێ',
    newFolder: 'فۆڵدەری نوێ',
    newProject: 'پرۆژەی نوێ',
    uploadFiles: 'هێنانی فایل',
    run: 'کارپێکردن',
    exportZip: 'داگرتن ZIP',
    downloadFile: 'داگرتن',
    format: 'ڕێکخستن',
    wrap: 'پێچانەوە',
    copy: 'کۆپی',
    copied: 'کۆپی کرا',
    splitView: 'دوو بەش',
    codeView: 'کۆد',
    previewView: 'پێشبینین',
    preview: 'پێشبینین',
    console: 'کۆنسۆڵ',
    clear: 'پاککردنەوە',
    reload: 'نوێکردنەوە',
    desktop: 'کۆمپیوتەر',
    tablet: 'تابلێت',
    mobile: 'مۆبایل',
    rename: 'ناوگۆڕین',
    duplicate: 'دوبارەکردنەوە',
    delete: 'سڕینەوە',
    cancel: 'پاشگەزبوونەوە',
    create: 'دروستکردن',
    save: 'پاشەکەوت',
    saved: 'پاشەکەوت کرا',
    projectName: 'ناوی پرۆژە',
    chooseTemplate: 'قاڵبێکی سەرەتایی هەڵبژێرە',
    searchPlaceholder: 'گەڕان لە ناو هەموو فایلەکان...',
    filterFilesPlaceholder: 'فلتەرکردنی فایل...',
    noFilesFound: 'هیچ فایلێک نەدۆزرایەوە.',
    noOpenFiles: 'فایلێک هەڵبژێرە یان فایلێکی نوێ دروست بکە بۆ نووسینی کۆد.',
    createFirstFile: 'دروستکردنی فایل',
    consolePlaceholder: 'نووسینی کۆدی JavaScript...',
    noConsoleOutput: 'دەرئەنجامی کۆنسۆڵ لێرە دەردەکەوێت.',
    validJson: 'JSON دروستە',
    invalidJson: 'هەڵەی ڕستەسازی',
    pythonNote: 'دەستکاریکردن و داگرتنی فایلی Python بەردەستە. پێشبینینی ڕاستەوخۆ کار دەکات بۆ HTML و CSS و JavaScript و Markdown و JSON.',
    plainTextNote: 'فایلی تێکست ئامادەیە بۆ دەستکاریکردن و داگرتن.',
    fileNamePlaceholder: 'نموونە: src/app.js',
    folderNamePlaceholder: 'نموونە: components',
    deleteProject: 'سڕینەوەی پرۆژە',
    projects: 'پرۆژەکان',
    autoRun: 'خۆکار',
    lineCol: (line, col) => `ڕیز ${line}, ستوون ${col}`,
    linesCount: (count) => `${count} ڕیز`,
    matchCount: (count) => `${count} ئەنجام`,
    toggleSidebar: 'لیستی فایل',
    darkMode: 'تاریک',
    lightMode: 'ڕووناک',
    undo: 'گەڕاندنەوە',
    redo: 'دووبارە',
    findInFile: 'گەڕان لە فایلدا',
    moreActions: 'ئامرازەکان',
    quickBar: 'کلیلی خێرا',
    close: 'داخستن',
    uploadFile: 'بارکردنی فایل',
    clearCode: 'سڕینەوەی کۆد',
    installApp: 'دابەزاندنی ئەپ',
    installOnIOS: 'دابەزاندنی ئەپ',
    iosInstallTitle: 'دابەزاندنی Coding Editor',
    iosInstallStep1: 'پەنجە بنێ بە دوگمەی Share لە Safari.',
    iosInstallStep2: 'هەڵبژێرە Add to Home Screen.',
    offlineMode: 'بێ ئینتەرنێت — گۆڕانکارییەکان لەسەر ئامێرەکە پاشەکەوت دەبن.',
  },
};
