import fs from 'fs';
import path from 'path';

const mixerDir = path.join(process.cwd(), 'src/components/mixer');
const panelsDir = path.join(process.cwd(), 'src/components/panels');
const testsDir = path.join(process.cwd(), 'tests/ui');

fs.mkdirSync(mixerDir, { recursive: true });
fs.mkdirSync(panelsDir, { recursive: true });
fs.mkdirSync(testsDir, { recursive: true });

fs.writeFileSync(path.join(mixerDir, 'OscHardwareMapper.ts'), `import * as monaco from 'monaco-editor';

export class OscHardwareMapper {
  private editor: monaco.editor.IStandaloneCodeEditor;

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
  }

  // Handle incoming OSC message from hardware
  public handleOscInput(address: string, value: number) {
    // Example address: /track/1/volume
    const parts = address.split('/');
    if (parts.length === 4 && parts[1] === 'track' && parts[3] === 'volume') {
      const trackId = parts[2];
      this.mutateVolume(trackId, value);
    }
  }

  // Translate hardware fader movement to .cc automation text mutation
  private mutateVolume(trackId: string, volume: number) {
    // In a real implementation, we would parse the AST to find the track and insert/update a .cc command.
    // For this implementation, we append a .cc command to the end of the file.
    const model = this.editor.getModel();
    if (!model) return;

    const lineCount = model.getLineCount();
    const lastLineLength = model.getLineMaxColumn(lineCount);

    const textToInsert = \`\\n// OSC Hardware Input\\ntrack_\${trackId}.cc(7, \${volume});\`;

    this.editor.executeEdits('osc-hardware', [{
      range: new monaco.Range(lineCount, lastLineLength, lineCount, lastLineLength),
      text: textToInsert,
      forceMoveMarkers: true
    }]);
  }
}
`);

fs.writeFileSync(path.join(panelsDir, 'TsnStageView.tsx'), `import * as React from 'react';

export interface TsnStageMetrics {
  predictiveExecutionLatency: number; // ms
  networkClockSyncOffset: number; // ms
  isSynced: boolean;
}

export const TsnStageView: React.FC<{ metrics: TsnStageMetrics }> = ({ metrics }) => {
  return (
    <div className="p-4 bg-slate-900 text-cyan-400 font-mono text-xs flex flex-col gap-2">
      <div className="font-bold text-white mb-2">TSN Stage View</div>
      <div className="flex justify-between">
        <span>Predictive Execution Latency:</span>
        <span>{metrics.predictiveExecutionLatency.toFixed(2)} ms</span>
      </div>
      <div className="flex justify-between">
        <span>Network Clock Sync Offset:</span>
        <span>{metrics.networkClockSyncOffset.toFixed(2)} ms</span>
      </div>
      <div className="flex justify-between">
        <span>Sync Status:</span>
        <span className={metrics.isSynced ? 'text-green-400' : 'text-red-500'}>
          {metrics.isSynced ? 'SYNCED' : 'OUT OF SYNC'}
        </span>
      </div>
    </div>
  );
};
`);

fs.writeFileSync(path.join(testsDir, 'test_osc_tsn_stage.ts'), `import { describe, it, expect, vi, afterEach } from 'vitest';
import * as React from 'react';
import { render, cleanup } from '@testing-library/react';
import { OscHardwareMapper } from '../../src/components/mixer/OscHardwareMapper';
import { TsnStageView, TsnStageMetrics } from '../../src/components/panels/TsnStageView';
import * as monaco from 'monaco-editor';

describe('OSC Hardware Mapper and TSN Stage View', () => {
  afterEach(() => {
    cleanup();
  });

  it('translates OSC hardware input into text mutations', () => {
    const executeEditsMock = vi.fn();
    const getModelMock = vi.fn().mockReturnValue({
      getLineCount: () => 10,
      getLineMaxColumn: () => 5
    });

    const editorMock = {
      executeEdits: executeEditsMock,
      getModel: getModelMock
    } as any;

    const mapper = new OscHardwareMapper(editorMock);
    
    // Simulate incoming OSC message for track 1 volume
    mapper.handleOscInput('/track/1/volume', 100);

    expect(executeEditsMock).toHaveBeenCalledWith('osc-hardware', [{
      range: expect.any(monaco.Range),
      text: '\\n// OSC Hardware Input\\ntrack_1.cc(7, 100);',
      forceMoveMarkers: true
    }]);
  });

  it('renders TSN Stage View metrics', () => {
    const metrics: TsnStageMetrics = {
      predictiveExecutionLatency: 2.5,
      networkClockSyncOffset: 0.1,
      isSynced: true
    };

    const { getByText } = render(<TsnStageView metrics={metrics} />);
    
    expect(getByText('TSN Stage View')).toBeDefined();
    expect(getByText('2.50 ms')).toBeDefined();
    expect(getByText('0.10 ms')).toBeDefined();
    expect(getByText('SYNCED')).toBeDefined();
  });
});
`);
