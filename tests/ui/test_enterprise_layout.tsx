import { describe, it, expect, vi, afterEach } from 'vitest';
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
