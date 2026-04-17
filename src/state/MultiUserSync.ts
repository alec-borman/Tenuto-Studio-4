import * as monaco from 'monaco-editor';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';

export interface SyncStatus {
  abletonLink: 'connected' | 'disconnected';
  tsnStatus: 'connected' | 'disconnected';
  activeUsers: number;
}

export class MultiUserSync {
  public editor: monaco.editor.IStandaloneCodeEditor;
  public status: SyncStatus;
  private onStatusChange: (status: SyncStatus) => void;
  public ydoc: Y.Doc;
  public ytext: Y.Text;
  public binding: MonacoBinding | null = null;
  public onUpdate: ((update: Uint8Array) => void) | null = null;

  constructor(editor: monaco.editor.IStandaloneCodeEditor, onStatusChange: (status: SyncStatus) => void) {
    this.editor = editor;
    this.status = {
      abletonLink: 'disconnected',
      tsnStatus: 'disconnected',
      activeUsers: 1
    };
    this.onStatusChange = onStatusChange;
    
    this.ydoc = new Y.Doc();
    this.ytext = this.ydoc.getText('monaco');
    
    const model = this.editor.getModel();
    if (model) {
      this.binding = new MonacoBinding(this.ytext, model, new Set([this.editor]));
    }

    this.editor.onDidChangeModel(() => {
      if (this.binding) {
        this.binding.destroy();
      }
      const newModel = this.editor.getModel();
      if (newModel) {
        this.binding = new MonacoBinding(this.ytext, newModel, new Set([this.editor]));
      }
    });

    this.ydoc.on('update', (update) => {
        if (this.onUpdate) {
            this.onUpdate(update);
        }
    });
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

  public applyRemoteUpdate(update: Uint8Array) {
    Y.applyUpdate(this.ydoc, update);
  }

  private notify() {
    this.onStatusChange(this.status);
  }
}
