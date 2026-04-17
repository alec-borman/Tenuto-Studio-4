import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as monaco from 'monaco-editor';
import { MultiUserSync } from '../../src/state/MultiUserSync';

describe('MultiUserSync CRDT', () => {
    let container1: HTMLDivElement;
    let container2: HTMLDivElement;
    let editor1: monaco.editor.IStandaloneCodeEditor;
    let editor2: monaco.editor.IStandaloneCodeEditor;

    beforeEach(() => {
        container1 = document.createElement('div');
        container2 = document.createElement('div');
        document.body.appendChild(container1);
        document.body.appendChild(container2);

        editor1 = monaco.editor.create(container1, { 
            value: 'initial',
            wordHighlight: 'off',
            occurrencesHighlight: 'off',
            minimap: { enabled: false }
        });
        editor2 = monaco.editor.create(container2, { 
            value: 'initial',
            wordHighlight: 'off',
            occurrencesHighlight: 'off',
            minimap: { enabled: false }
        });
    });

    afterEach(() => {
        editor1.dispose();
        editor2.dispose();
        document.body.removeChild(container1);
        document.body.removeChild(container2);
    });

    it('initializes with disconnected status', () => {
      const onStatusChange = vi.fn();
      const sync1 = new MultiUserSync(editor1, onStatusChange);
      
      sync1.connect();
      expect(onStatusChange).toHaveBeenCalledWith({
        abletonLink: 'disconnected',
        tsnStatus: 'connected',
        activeUsers: 2
      });
    });

    it('resolves concurrent multi-user edits deterministically without race conditions', () => {
        const sync1 = new MultiUserSync(editor1, vi.fn());
        const sync2 = new MultiUserSync(editor2, vi.fn());

        const updates1: Uint8Array[] = [];
        const updates2: Uint8Array[] = [];

        // Pause syncing instantly
        sync1.onUpdate = (u) => updates1.push(u);
        sync2.onUpdate = (u) => updates2.push(u);

        // Client 1 types concurrently
        sync1.ytext.insert(7, ' A');
        // Client 2 types concurrently at same pos
        sync2.ytext.insert(7, ' B');

        // Apply updates across network delay
        for (const update of updates1) {
            sync2.applyRemoteUpdate(update);
        }
        for (const update of updates2) {
            sync1.applyRemoteUpdate(update);
        }

        // Must be deterministically exact same state
        console.log('Result sync1:', sync1.ytext.toString());
        console.log('Result sync2:', sync2.ytext.toString());
        
        expect(sync1.ytext.toString()).toBe(sync2.ytext.toString());
        // Valid AST convergence text check
        const finalStr = sync1.ytext.toString();
        expect(finalStr === ' A B' || finalStr === ' B A' || finalStr === 'initial A B' || finalStr === 'initial B A').toBeTruthy();
    });
});

