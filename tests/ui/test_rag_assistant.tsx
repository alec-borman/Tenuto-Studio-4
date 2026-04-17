import { describe, it, expect, vi, afterEach } from 'vitest';
import * as React from 'react';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { RagAssistant } from '../../src/components/panels/RagAssistant';

describe('RAG Assistant', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders chat interface', () => {
    const { getByText, getByPlaceholderText } = render(
      <RagAssistant editorSelection="" onQuery={vi.fn()} onApplyPatch={vi.fn()} />
    );
    expect(getByText('RAG Assistant')).toBeDefined();
    expect(getByPlaceholderText('Ask a question...')).toBeDefined();
  });

  it('queries vector index asynchronously without blocking', async () => {
    const onQuery = vi.fn().mockResolvedValue({
      id: '2',
      role: 'assistant',
      content: 'Here is the answer.'
    });
    const { getByPlaceholderText, getByText } = render(
      <RagAssistant editorSelection="def sketch" onQuery={onQuery} onApplyPatch={vi.fn()} />
    );
    
    const input = getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'How to write a macro?' } });
    
    const sendButton = getByText('Send');
    fireEvent.click(sendButton);
    
    expect(getByText('Searching vector index...')).toBeDefined();
    expect(onQuery).toHaveBeenCalledWith('How to write a macro?', 'def sketch');
    
    await waitFor(() => {
      expect(getByText('Here is the answer.')).toBeDefined();
    });
  });

  it('renders Apply Patch button and executes editor update', async () => {
    const onQuery = vi.fn().mockResolvedValue({
      id: '2',
      role: 'assistant',
      content: 'I wrote a macro for you.',
      patch: 'macro MyMacro { c4 d e }'
    });
    const onApplyPatch = vi.fn();
    const { getByPlaceholderText, getByText } = render(
      <RagAssistant editorSelection="" onQuery={onQuery} onApplyPatch={onApplyPatch} />
    );
    
    const input = getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'Write a macro' } });
    fireEvent.click(getByText('Send'));
    
    await waitFor(() => {
      expect(getByText('Accept Patch')).toBeDefined();
    });
    
    fireEvent.click(getByText('Accept Patch'));
    expect(onApplyPatch).toHaveBeenCalledWith('macro MyMacro { c4 d e }');
  });
});
