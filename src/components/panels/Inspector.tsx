import * as React from 'react';

export interface ASTNode {
  id: string;
  type: 'note' | 'staff' | 'macro';
  properties: Record<string, string>;
  range: { startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number };
}

export interface InspectorProps {
  selectedNode: ASTNode | null;
  onMutate: (nodeId: string, property: string, newValue: string, range: any) => void;
}

export const Inspector: React.FC<InspectorProps> = ({ selectedNode, onMutate }) => {
  if (!selectedNode) {
    return React.createElement('div', { className: 'p-4 text-slate-500' }, 'No element selected');
  }

  return React.createElement('div', { className: 'p-4 flex flex-col gap-4' },
    React.createElement('h2', { className: 'text-lg font-bold capitalize' }, selectedNode.type + ' Properties'),
    Object.entries(selectedNode.properties).map(([key, value]) => 
      React.createElement('div', { key, className: 'flex flex-col gap-1' },
        React.createElement('label', { className: 'text-sm font-medium text-slate-700 capitalize' }, key),
        React.createElement('input', {
          type: 'text',
          className: 'border rounded px-2 py-1 text-sm',
          value: value,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => onMutate(selectedNode.id, key, e.target.value, selectedNode.range)
        })
      )
    )
  );
};
