import * as React from 'react';

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
