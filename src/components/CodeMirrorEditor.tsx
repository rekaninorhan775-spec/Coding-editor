import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, dropCursor } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab, redo, undo } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches, openSearchPanel } from '@codemirror/search';
import { oneDark } from '@codemirror/theme-one-dark';
import type { CursorStats, EditorLanguage } from '../types/workspace';
import { getLanguageExtension } from '../utils/language';

export interface CodeMirrorEditorHandle {
  insertText: (text: string, cursorOffset?: number) => void;
  undoAction: () => void;
  redoAction: () => void;
  openSearch: () => void;
  clearAll: () => void;
}

interface CodeMirrorEditorProps {
  fileId: string;
  value: string;
  language: EditorLanguage;
  theme: 'dark' | 'light';
  wordWrap: boolean;
  fontSize: number;
  onChange: (nextValue: string) => void;
  onCursorChange?: (stats: CursorStats) => void;
  onSaveShortcut?: () => void;
  onRunShortcut?: () => void;
}

const lightThemeExtension = EditorView.theme(
  {
    '&': {
      backgroundColor: '#FFFFFF',
      color: '#1F2328',
    },
    '.cm-content': {
      caretColor: '#2563EB',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#2563EB',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(37, 99, 235, 0.16)',
    },
    '.cm-gutters': {
      backgroundColor: '#F6F8FA',
      color: '#656D76',
      borderRight: '1px solid #E5E7EB',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#EBEEF2',
      color: '#1F2328',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(241, 245, 249, 0.75)',
    },
  },
  { dark: false }
);

const darkSurfaceOverride = EditorView.theme(
  {
    '&': {
      backgroundColor: '#0D1117',
    },
    '.cm-gutters': {
      backgroundColor: '#0D1117',
      borderRight: '1px solid #21262D',
      color: '#6E7681',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#161B22',
      color: '#E6EDF3',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(22, 27, 34, 0.65)',
    },
  },
  { dark: true }
);

function buildFontTheme(fontSize: number) {
  return EditorView.theme({
    '&': {
      fontSize: `${fontSize}px`,
      height: '100%',
    },
    '.cm-scroller': {
      lineHeight: '1.6',
      paddingTop: '10px',
      paddingBottom: '24px',
    },
    '.cm-gutters': {
      paddingLeft: '2px',
      paddingRight: '2px',
      minWidth: '40px',
    },
  });
}

export const CodeMirrorEditor = forwardRef<CodeMirrorEditorHandle, CodeMirrorEditorProps>(
  function CodeMirrorEditor(
    {
      fileId,
      value,
      language,
      theme,
      wordWrap,
      fontSize,
      onChange,
      onCursorChange,
      onSaveShortcut,
      onRunShortcut,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewRef = useRef<EditorView | null>(null);
    const activeFileIdRef = useRef<string>(fileId);

    const onChangeRef = useRef(onChange);
    const onCursorChangeRef = useRef(onCursorChange);
    const onSaveRef = useRef(onSaveShortcut);
    const onRunRef = useRef(onRunShortcut);

    onChangeRef.current = onChange;
    onCursorChangeRef.current = onCursorChange;
    onSaveRef.current = onSaveShortcut;
    onRunRef.current = onRunShortcut;

    const languageCompartment = useRef(new Compartment()).current;
    const themeCompartment = useRef(new Compartment()).current;
    const wrapCompartment = useRef(new Compartment()).current;
    const fontCompartment = useRef(new Compartment()).current;

    useImperativeHandle(
      ref,
      () => ({
        insertText: (text: string, cursorOffset?: number) => {
          const view = viewRef.current;
          if (!view) return;
          const { from, to } = view.state.selection.main;
          const anchor =
            typeof cursorOffset === 'number' ? from + cursorOffset : from + text.length;
          view.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor },
          });
          view.focus();
        },
        undoAction: () => {
          const view = viewRef.current;
          if (!view) return;
          undo(view);
          view.focus();
        },
        redoAction: () => {
          const view = viewRef.current;
          if (!view) return;
          redo(view);
          view.focus();
        },
        openSearch: () => {
          const view = viewRef.current;
          if (!view) return;
          openSearchPanel(view);
          view.focus();
        },
        clearAll: () => {
          const view = viewRef.current;
          if (!view) return;
          const len = view.state.doc.length;
          if (len > 0) {
            view.dispatch({
              changes: { from: 0, to: len, insert: '' },
              selection: { anchor: 0 },
            });
          }
          view.focus();
        },
      }),
      []
    );

  const emitStats = (state: EditorState) => {
    if (!onCursorChangeRef.current) return;
    const main = state.selection.main;
    const lineObj = state.doc.lineAt(main.head);
    onCursorChangeRef.current({
      line: lineObj.number,
      col: main.head - lineObj.from + 1,
      lines: state.doc.lines,
      length: state.doc.length,
      selectionLength: Math.abs(main.to - main.from),
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const customShortcuts = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          onSaveRef.current?.();
          return true;
        },
      },
      {
        key: 'Mod-Enter',
        run: () => {
          onRunRef.current?.();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        customShortcuts,
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          indentWithTab,
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
        ]),
        languageCompartment.of(getLanguageExtension(language)),
        themeCompartment.of(
          theme === 'dark' ? [oneDark, darkSurfaceOverride] : [lightThemeExtension]
        ),
        wrapCompartment.of(wordWrap ? EditorView.lineWrapping : []),
        fontCompartment.of(buildFontTheme(fontSize)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
          if (update.selectionSet || update.docChanged) {
            emitStats(update.state);
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    emitStats(view.state);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Initialize once; compartments & doc updates handle runtime changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync document content when switching files or formatting externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    const isFileSwitch = activeFileIdRef.current !== fileId;

    if (isFileSwitch || currentDoc !== value) {
      activeFileIdRef.current = fileId;
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: value,
        },
      });
      if (isFileSwitch) {
        view.dispatch({ selection: { anchor: 0 } });
      }
      emitStats(view.state);
    }
  }, [fileId, value]);

  // Update language extension
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: languageCompartment.reconfigure(getLanguageExtension(language)),
    });
  }, [language, languageCompartment]);

  // Update theme
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: themeCompartment.reconfigure(
        theme === 'dark' ? [oneDark, darkSurfaceOverride] : [lightThemeExtension]
      ),
    });
  }, [theme, themeCompartment]);

  // Update word wrap
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: wrapCompartment.reconfigure(wordWrap ? EditorView.lineWrapping : []),
    });
  }, [wordWrap, wrapCompartment]);

  // Update font size
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: fontCompartment.reconfigure(buildFontTheme(fontSize)),
    });
  }, [fontSize, fontCompartment]);

    return (
      <div
        ref={containerRef}
        dir="ltr"
        className="h-full w-full overflow-hidden text-left"
      />
    );
  }
);
