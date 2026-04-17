import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src/components/panels');
const testsDir = path.join(process.cwd(), 'tests/ui');

fs.mkdirSync(srcDir, { recursive: true });
fs.mkdirSync(testsDir, { recursive: true });

fs.writeFileSync(path.join(srcDir, 'Inspector.tsx'), `import React from 'react';

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
`);

fs.writeFileSync(path.join(testsDir, 'test_inspector.tsx'), `import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Inspector, ASTNode } from '../../src/components/panels/Inspector';

describe('Inspector Panel', () => {
  it('renders empty state when no node is selected', () => {
    const { getByText } = render(<Inspector selectedNode={null} onMutate={vi.fn()} />);
    expect(getByText('No element selected')).toBeDefined();
  });

  it('renders properties of selected node', () => {
    const node: ASTNode = {
      id: '1',
      type: 'note',
      properties: { pitch: 'C4', duration: ':4' },
      range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 }
    };
    const { getByDisplayValue, getByText } = render(<Inspector selectedNode={node} onMutate={vi.fn()} />);
    
    expect(getByText('note Properties')).toBeDefined();
    expect(getByDisplayValue('C4')).toBeDefined();
    expect(getByDisplayValue(':4')).toBeDefined();
  });

  it('calls onMutate when input changes, adhering to unidirectional data flow', () => {
    const node: ASTNode = {
      id: '1',
      type: 'note',
      properties: { pitch: 'C4' },
      range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 3 }
    };
    const onMutate = vi.fn();
    const { getByDisplayValue } = render(<Inspector selectedNode={node} onMutate={onMutate} />);
    
    const input = getByDisplayValue('C4');
    fireEvent.change(input, { target: { value: 'D4' } });
    
    expect(onMutate).toHaveBeenCalledWith('1', 'pitch', 'D4', node.range);
  });
});
`);
