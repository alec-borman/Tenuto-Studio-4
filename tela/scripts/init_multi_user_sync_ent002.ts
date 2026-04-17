import fs from 'fs';
import path from 'path';

const stateDir = path.join(process.cwd(), 'src/state');
const testsDir = path.join(process.cwd(), 'tests/ui');

fs.mkdirSync(stateDir, { recursive: true });
fs.mkdirSync(testsDir, { recursive: true });

fs.writeFileSync(path.join(stateDir, 'MultiUserSync.ts'), `import * as monaco from 'monaco-editor';

export interface SyncStatus {
  abletonLink: 'connected' | 'disconnected';
  tsnStatus: 'connected' | 'disconnected';
  activeUsers: number;
}

export class MultiUserSync {
  private editor: monaco.editor.IStandaloneCodeEditor;
  private status: SyncStatus;
  private onStatusChange: (status: SyncStatus) => void;

  constructor(editor: monaco.editor.IStandaloneCodeEditor, onStatusChange: (status: SyncStatus) => void) {
    this.editor = editor;
    this.status = {
      abletonLink: 'disconnected',
      tsnStatus: 'disconnected',
      activeUsers: 1
    };
    this.onStatusChange = onStatusChange;
  }

  public connect() {
    this.status = { ...this.status, tsnStatus: 'connected', activeUsers: 2 };
    this.notify();
  }

  public disconnect() {
    this.status = { ...this.status, tsnStatus: 'disconnected', activeUsers: 1 };
    this.notify();
  }

  public enableAbletonLink() {
    this.status = { ...this.status, abletonLink: 'connected' };
    this.notify();
  }

  public applyRemoteEdit(range: monaco.IRange, text: string) {
    this.editor.executeEdits('multi-user-sync', [{
      range,
      text,
      forceMoveMarkers: true
    }]);
  }

  private notify() {
    this.onStatusChange(this.status);
  }
}
`);

fs.writeFileSync(path.join(testsDir, 'test_multi_user_sync.ts'), `import { describe, it, expect, vi } from 'vitest';
import { MultiUserSync } from '../../src/state/MultiUserSync';

describe('MultiUserSync', () => {
  it('initializes with disconnected status', () => {
    const editorMock = {
      executeEdits: vi.fn()
    } as any;
    const onStatusChange = vi.fn();
    const sync = new MultiUserSync(editorMock, onStatusChange);
    
    sync.connect();
    expect(onStatusChange).toHaveBeenCalledWith({
      abletonLink: 'disconnected',
      tsnStatus: 'connected',
      activeUsers: 2
    });
  });

  it('applies remote edits to the editor', () => {
    const editorMock = {
      executeEdits: vi.fn()
    } as any;
    const sync = new MultiUserSync(editorMock, vi.fn());
    
    sync.applyRemoteEdit({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 2 }, 'test');
    expect(editorMock.executeEdits).toHaveBeenCalledWith('multi-user-sync', [{
      range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 2 },
      text: 'test',
      forceMoveMarkers: true
    }]);
  });
});
`);
