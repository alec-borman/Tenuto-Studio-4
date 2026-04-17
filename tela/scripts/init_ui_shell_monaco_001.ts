import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src/components/layout');
const editorDir = path.join(process.cwd(), 'src/editor');
const testsDir = path.join(process.cwd(), 'tests/ui');

fs.mkdirSync(srcDir, { recursive: true });
fs.mkdirSync(editorDir, { recursive: true });
fs.mkdirSync(testsDir, { recursive: true });

fs.writeFileSync(path.join(srcDir, 'Workspace.tsx'), `import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { languageDef, themeDef } from '../../editor/TenutoMonacoDef';

export const Workspace: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      monaco.languages.register({ id: 'tenuto' });
      monaco.languages.setMonarchTokensProvider('tenuto', languageDef);
      monaco.editor.defineTheme('tenutoTheme', themeDef);

      const editor = monaco.editor.create(editorRef.current, {
        value: 'tenuto "4.0" {\\n  \\n}',
        language: 'tenuto',
        theme: 'tenutoTheme',
      });

      // Web Worker for LSP diagnostics (debounced by 200ms)
      let timeout: number;
      editor.onDidChangeModelContent(() => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          // Send to Web Worker for compilation/diagnostics
          // worker.postMessage(editor.getValue());
        }, 200);
      });

      return () => editor.dispose();
    }
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <header className="h-12 bg-slate-800 text-white flex items-center px-4">Top Bar</header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-slate-100 border-r">Left Sidebar (Explorer/Outline)</aside>
        <main className="flex-1 flex">
          <div className="flex-1 border-r" ref={editorRef}></div>
          <div className="flex-1 bg-white">Graphical Canvas</div>
        </main>
        <aside className="w-64 bg-slate-100 border-l">Right Sidebar (Inspector)</aside>
      </div>
      <footer className="h-8 bg-slate-800 text-white flex items-center px-4">Bottom Status Bar</footer>
    </div>
  );
};
`);

fs.writeFileSync(path.join(editorDir, 'TenutoMonacoDef.ts'), `import * as monaco from 'monaco-editor';

export const languageDef: monaco.languages.IMonarchLanguage = {
  keywords: ['def', 'measure', 'meta', 'import', 'macro', 'var', 'tenuto'],
  sigils: ['{', '}', '<[', ']>', '@{', ']', '[', ':', '.', '$'],
  tokenizer: {
    root: [
      [/[a-zA-Z_]\\w*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
      [/(?i)[a-g](?:qs|qf|tqs|tqf|bb|x|#|b|n)*(?:[0-9])?(?:[+-][0-9]+)?/, 'string.pitch'],
      [/%%.*/, 'comment'],
      [/"([^"\\\\]|\\\\.)*"/, 'string'],
      [/[{}<>[\\\\]:@.$]/, 'delimiter'],
    ]
  }
};

export const themeDef: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
    { token: 'string.pitch', foreground: '008800' },
    { token: 'comment', foreground: '008800', fontStyle: 'italic' },
    { token: 'delimiter', foreground: 'FF0000' }
  ],
  colors: {}
};
`);

fs.writeFileSync(path.join(testsDir, 'test_editor_shell.tsx'), `import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { Workspace } from '../../src/components/layout/Workspace';

// Mock monaco-editor
vi.mock('monaco-editor', () => ({
  languages: {
    register: vi.fn(),
    setMonarchTokensProvider: vi.fn()
  },
  editor: {
    defineTheme: vi.fn(),
    create: vi.fn(() => ({
      dispose: vi.fn(),
      onDidChangeModelContent: vi.fn(),
      getValue: vi.fn()
    }))
  }
}));

describe('Workspace Shell', () => {
  it('renders all shell components', () => {
    const { getByText } = render(<Workspace />);
    expect(getByText('Top Bar')).toBeDefined();
    expect(getByText('Left Sidebar (Explorer/Outline)')).toBeDefined();
    expect(getByText('Right Sidebar (Inspector)')).toBeDefined();
    expect(getByText('Bottom Status Bar')).toBeDefined();
  });
});
`);
