import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src/components/mixer');
const testsDir = path.join(process.cwd(), 'tests/ui');

fs.mkdirSync(srcDir, { recursive: true });
fs.mkdirSync(testsDir, { recursive: true });

fs.writeFileSync(path.join(srcDir, 'MixerView.tsx'), `import * as React from 'react';

export interface TrackDef {
  id: string;
  name: string;
  volume: number; // 0-127
  pan: number; // -64 to 63
  fx: string[];
  sidechainTarget?: string;
}

export interface MixerViewProps {
  tracks: TrackDef[];
  onMutateVolume: (trackId: string, volume: number) => void;
  onMutatePan: (trackId: string, pan: number) => void;
  onMutateFX: (trackId: string, fxIndex: number, newFx: string) => void;
  onMutateSidechain: (trackId: string, target: string) => void;
}

export const MixerView: React.FC<MixerViewProps> = ({ tracks, onMutateVolume, onMutatePan, onMutateFX, onMutateSidechain }) => {
  return (
    <div className="flex flex-row gap-4 p-4 overflow-x-auto bg-slate-900 text-white h-full">
      {tracks.map(track => (
        <div key={track.id} className="flex flex-col items-center w-24 bg-slate-800 p-2 rounded">
          <div className="text-xs font-bold mb-2 truncate w-full text-center">{track.name}</div>
          
          <div className="flex flex-row gap-1 mb-2">
            <button className="w-6 h-6 bg-slate-700 rounded text-xs">M</button>
            <button className="w-6 h-6 bg-slate-700 rounded text-xs">S</button>
          </div>

          {/* Pan Knob Representation */}
          <div className="mb-2 flex flex-col items-center">
            <label className="text-[10px]">Pan</label>
            <input 
              type="range" 
              min="-64" max="63" 
              value={track.pan} 
              onChange={(e) => onMutatePan(track.id, parseInt(e.target.value, 10))}
              className="w-16"
            />
          </div>

          {/* Volume Fader */}
          <div className="flex-1 flex flex-col items-center mb-2">
            <input 
              type="range" 
              min="0" max="127" 
              value={track.volume} 
              onChange={(e) => onMutateVolume(track.id, parseInt(e.target.value, 10))}
              className="h-32"
              style={{ writingMode: 'vertical-lr', direction: 'rtl' } as any}
            />
            <label className="text-[10px] mt-1">Vol</label>
          </div>

          {/* FX Slots */}
          <div className="w-full flex flex-col gap-1 mb-2">
            <div className="text-[10px] font-bold">FX</div>
            {track.fx.map((effect, idx) => (
              <input 
                key={idx}
                type="text" 
                value={effect} 
                onChange={(e) => onMutateFX(track.id, idx, e.target.value)}
                className="w-full text-xs text-black px-1"
              />
            ))}
          </div>

          {/* Sidechain Routing */}
          <div className="w-full flex flex-col gap-1">
            <div className="text-[10px] font-bold">Sidechain</div>
            <select 
              value={track.sidechainTarget || ""} 
              onChange={(e) => onMutateSidechain(track.id, e.target.value)}
              className="w-full text-xs text-black"
            >
              <option value="">None</option>
              {tracks.filter(t => t.id !== track.id).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {/* Master Bus */}
      <div className="flex flex-col items-center w-24 bg-slate-700 p-2 rounded border-l-2 border-slate-900 ml-4">
        <div className="text-xs font-bold mb-2 truncate w-full text-center">Master</div>
        <div className="flex-1 flex flex-col items-center mb-2 mt-12">
          <input 
            type="range" 
            min="0" max="127" 
            defaultValue="100"
            onChange={(e) => onMutateVolume('master', parseInt(e.target.value, 10))}
            className="h-32"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' } as any}
          />
          <label className="text-[10px] mt-1">Vol</label>
        </div>
      </div>
    </div>
  );
};
`);

fs.writeFileSync(path.join(testsDir, 'test_mixer.tsx'), `import { describe, it, expect, vi, afterEach } from 'vitest';
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
    const { getByText } = render(
      <MixerView 
        tracks={mockTracks} 
        onMutateVolume={vi.fn()} 
        onMutatePan={vi.fn()} 
        onMutateFX={vi.fn()} 
        onMutateSidechain={vi.fn()} 
      />
    );
    expect(getByText('Kick')).toBeDefined();
    expect(getByText('Bass')).toBeDefined();
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
`);
