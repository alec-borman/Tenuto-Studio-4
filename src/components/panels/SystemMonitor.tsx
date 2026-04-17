import * as React from 'react';

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
