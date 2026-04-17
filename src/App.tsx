/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { Workspace } from './components/layout/Workspace';
import { MultiWindowManager, WindowState } from './components/layout/MultiWindowManager';

export default function App() {
  const [windows, setWindows] = React.useState<WindowState[]>([
    { id: 'w1', title: 'Monaco Code Editor', isDetached: false },
    { id: 'w2', title: 'Canonical Projection Canvas', isDetached: false },
    { id: 'w3', title: 'Advanced Tools/Inspector', isDetached: false }
  ]);

  const handleDetach = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isDetached: true } : w));
  };

  const handleAttach = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isDetached: false } : w));
  };

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 relative">
        <Workspace />
      </div>
      <div className="w-80 border-l bg-white overflow-y-auto">
        <MultiWindowManager 
          windows={windows} 
          onDetach={handleDetach} 
          onAttach={handleAttach} 
        />
      </div>
    </div>
  );
}
