import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src/components/panels');
const testsDir = path.join(process.cwd(), 'tests/ui');

fs.mkdirSync(srcDir, { recursive: true });
fs.mkdirSync(testsDir, { recursive: true });

fs.writeFileSync(path.join(srcDir, 'RagAssistant.tsx'), `import * as React from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  patch?: string;
}

export interface RagAssistantProps {
  editorSelection: string;
  onQuery: (query: string, selection: string) => Promise<Message>;
  onApplyPatch: (patch: string) => void;
}

export const RagAssistant: React.FC<RagAssistantProps> = ({ editorSelection, onQuery, onApplyPatch }) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Offload LanceDB retrieval queries via async onQuery
      const response = await onQuery(userMsg.content, editorSelection);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200">
      <div className="p-3 border-b border-slate-200 bg-white font-bold text-sm">
        RAG Assistant
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map(msg => (
          <div key={msg.id} className={\`flex flex-col \${msg.role === 'user' ? 'items-end' : 'items-start'}\`}>
            <div className={\`p-2 rounded-lg max-w-[80%] text-sm \${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-800'}\`}>
              {msg.content}
            </div>
            {msg.patch && (
              <button 
                onClick={() => onApplyPatch(msg.patch!)}
                className="mt-2 text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
              >
                Apply Patch
              </button>
            )}
          </div>
        ))}
        {isLoading && <div className="text-xs text-slate-500">Searching vector index...</div>}
      </div>
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 border rounded px-2 py-1 text-sm"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
};
`);

fs.writeFileSync(path.join(testsDir, 'test_rag_assistant.tsx'), `import { describe, it, expect, vi, afterEach } from 'vitest';
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
      expect(getByText('Apply Patch')).toBeDefined();
    });
    
    fireEvent.click(getByText('Apply Patch'));
    expect(onApplyPatch).toHaveBeenCalledWith('macro MyMacro { c4 d e }');
  });
});
`);
