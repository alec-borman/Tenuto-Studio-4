import * as React from 'react';

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
