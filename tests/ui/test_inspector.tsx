import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Inspector, ASTNode } from '../../src/components/panels/Inspector';

describe('Inspector Panel', () => {
  afterEach(() => {
    cleanup();
  });

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
