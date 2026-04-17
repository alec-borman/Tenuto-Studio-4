import { describe, it, expect, vi, afterEach } from 'vitest';
import * as React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { MixerView, TrackDef } from '../../src/components/mixer/MixerView';

describe('Mixer View', () => {
  afterEach(() => {
    cleanup();
  });

  const mockTracks: TrackDef[] = [
    { id: 't1', name: 'Kick', volume: 100, pan: 0, fx: ['reverb'] },
    { id: 't2', name: 'Bass', volume: 90, pan: 0, fx: [], sidechainTarget: 't1' }
  ];

  it('renders channel strips and master bus', () => {
    const { getAllByText, getByText } = render(
      <MixerView 
        tracks={mockTracks} 
        onMutateVolume={vi.fn()} 
        onMutatePan={vi.fn()} 
        onMutateFX={vi.fn()} 
        onMutateSidechain={vi.fn()} 
      />
    );
    expect(getAllByText('Kick').length).toBeGreaterThan(0);
    expect(getAllByText('Bass').length).toBeGreaterThan(0);
    expect(getByText('Master')).toBeDefined();
  });

  it('dispatches volume mutation command on fader change', () => {
    const onMutateVolume = vi.fn();
    const { getAllByRole } = render(
      <MixerView 
        tracks={mockTracks} 
        onMutateVolume={onMutateVolume} 
        onMutatePan={vi.fn()} 
        onMutateFX={vi.fn()} 
        onMutateSidechain={vi.fn()} 
      />
    );
    
    const sliders = getAllByRole('slider');
    // sliders[1] is Kick Vol
    fireEvent.change(sliders[1], { target: { value: '110' } });
    expect(onMutateVolume).toHaveBeenCalledWith('t1', 110);
  });

  it('dispatches sidechain routing mutation', () => {
    const onMutateSidechain = vi.fn();
    const { getAllByRole } = render(
      <MixerView 
        tracks={mockTracks} 
        onMutateVolume={vi.fn()} 
        onMutatePan={vi.fn()} 
        onMutateFX={vi.fn()} 
        onMutateSidechain={onMutateSidechain} 
      />
    );
    
    const selects = getAllByRole('combobox');
    // selects[0] is Kick sidechain
    fireEvent.change(selects[0], { target: { value: 't2' } });
    expect(onMutateSidechain).toHaveBeenCalledWith('t1', 't2');
  });
});
