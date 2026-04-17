import * as React from 'react';

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
