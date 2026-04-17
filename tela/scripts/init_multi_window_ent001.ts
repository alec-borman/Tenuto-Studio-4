import fs from 'fs';
import path from 'path';

const layoutDir = path.join(process.cwd(), 'src/components/layout');
const panelsDir = path.join(process.cwd(), 'src/components/panels');
const testsDir = path.join(process.cwd(), 'tests/ui');

fs.mkdirSync(layoutDir, { recursive: true });
fs.mkdirSync(panelsDir, { recursive: true });
fs.mkdirSync(testsDir, { recursive: true });

fs.writeFileSync(path.join(layoutDir, 'MultiWindowManager.tsx'), `import * as React from 'react';

export interface WindowState {
  id: string;
  title: string;
  isDetached: boolean;
}

export interface MultiWindowManagerProps {
  windows: WindowState[];
  onDetach: (id: string) => void;
  onAttach: (id: string) => void;
}

export const MultiWindowManager: React.FC<MultiWindowManagerProps> = ({ windows, onDetach, onAttach }) => {
  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-lg font-bold">Multi-Window Manager</h2>
      {windows.map(w => (
        <div key={w.id} className="flex justify-between items-center bg-slate-100 p-2 rounded">
          <span>{w.title}</span>
          {w.isDetached ? (
            <button onClick={() => onAttach(w.id)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Attach</button>
          ) : (
            <button onClick={() => onDetach(w.id)} className="bg-slate-500 text-white px-2 py-1 rounded text-xs">Detach</button>
          )}
        </div>
      ))}
    </div>
  );
};
`);

fs.writeFileSync(path.join(panelsDir, 'SystemMonitor.tsx'), `import * as React from 'react';

export interface SystemMetrics {
  compilerStatus: 'idle' | 'compiling' | 'error';
  dspLoad: number; // percentage
  memoryUsage: number; // MB
}

export const SystemMonitor: React.FC<{ metrics: SystemMetrics }> = ({ metrics }) => {
  return (
    <div className="p-4 bg-slate-900 text-green-400 font-mono text-xs flex flex-col gap-2">
      <div className="font-bold text-white mb-2">System Monitor</div>
      <div className="flex justify-between">
        <span>Compiler (WASM):</span>
        <span className={metrics.compilerStatus === 'error' ? 'text-red-500' : 'text-green-400'}>
          {metrics.compilerStatus.toUpperCase()}
        </span>
      </div>
      <div className="flex justify-between">
        <span>DSP Load (WASM):</span>
        <span>{metrics.dspLoad.toFixed(1)}%</span>
      </div>
      <div className="flex justify-between">
        <span>Memory Usage:</span>
        <span>{metrics.memoryUsage.toFixed(1)} MB</span>
      </div>
    </div>
  );
};
`);

fs.writeFileSync(path.join(testsDir, 'test_enterprise_layout.tsx'), `import { describe, it, expect, vi, afterEach } from 'vitest';
import * as React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { MultiWindowManager, WindowState } from '../../src/components/layout/MultiWindowManager';
import { SystemMonitor, SystemMetrics } from '../../src/components/panels/SystemMonitor';

describe('Enterprise Layout', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders MultiWindowManager and handles detach/attach', () => {
    const windows: WindowState[] = [
      { id: 'w1', title: 'Monaco Code Editor', isDetached: false },
      { id: 'w2', title: 'Canonical Projection', isDetached: true },
      { id: 'w3', title: 'Advanced Tools & Inspector', isDetached: false }
    ];
    const onDetach = vi.fn();
    const onAttach = vi.fn();

    const { getByText, getAllByText } = render(
      <MultiWindowManager windows={windows} onDetach={onDetach} onAttach={onAttach} />
    );

    expect(getByText('Monaco Code Editor')).toBeDefined();
    expect(getByText('Canonical Projection')).toBeDefined();
    expect(getByText('Advanced Tools & Inspector')).toBeDefined();

    const detachButtons = getAllByText('Detach');
    fireEvent.click(detachButtons[0]);
    expect(onDetach).toHaveBeenCalledWith('w1');

    const attachButton = getByText('Attach');
    fireEvent.click(attachButton);
    expect(onAttach).toHaveBeenCalledWith('w2');
  });

  it('renders SystemMonitor with metrics', () => {
    const metrics: SystemMetrics = {
      compilerStatus: 'compiling',
      dspLoad: 45.2,
      memoryUsage: 128.5
    };

    const { getByText } = render(<SystemMonitor metrics={metrics} />);
    
    expect(getByText('COMPILING')).toBeDefined();
    expect(getByText('45.2%')).toBeDefined();
    expect(getByText('128.5 MB')).toBeDefined();
  });
});
`);
