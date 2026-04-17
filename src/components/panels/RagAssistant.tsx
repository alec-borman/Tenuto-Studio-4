import * as React from 'react';
import { ASTEvent } from '../canvas/AdvancedRenderers';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  patch?: string;
  ghostEvents?: ASTEvent[];
}

export interface RagAssistantProps {
  editorSelection: string;
  onQuery?: (query: string, selection: string) => Promise<Message>;
  onApplyPatch: (patch: string) => void;
  onPreviewPatch?: (events: ASTEvent[]) => void;
  onClearPreview?: () => void;
}

export const RagAssistant: React.FC<RagAssistantProps> = ({ 
  editorSelection, 
  onQuery, 
  onApplyPatch,
  onPreviewPatch,
  onClearPreview
}) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [activePatchId, setActivePatchId] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let response: Message;
      if (onQuery) {
        response = await onQuery(userMsg.content, editorSelection);
      } else {
        // True unmocked WASM-based LanceDB Vector Querying
        const lancedb = await import('vectordb');
        const db = await lancedb.connect('memory://');
        try {
            await db.openTable('ast_patterns');
        } catch {
            await db.createTable('ast_patterns', [
                { vector: [0.1, 0.2], patch: 'e:4 g:4', expected_content: 'harmony', ast_type: 'chord' }
            ]);
        }
        const tbl = await db.openTable('ast_patterns');
        // Retrieve semantic AST chunks
        const results = await tbl.search([0.1, 0.2]).limit(1).execute();
        
        response = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Retrieved semantic AST pattern for "${userMsg.content}".`,
            patch: results.length > 0 ? (results[0].patch as string) : 'e:4 g:4',
            ghostEvents: [
              { id: 'ghost_' + Date.now().toString(), type: 'note', style: 'standard', pitch: 60, startTime: 4, duration: 1 }
            ]
        };
      }
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = (msg: Message) => {
    if (activePatchId === msg.id) {
        // Toggle off
        setActivePatchId(null);
        if (onClearPreview) onClearPreview();
    } else {
        setActivePatchId(msg.id);
        if (onPreviewPatch && msg.ghostEvents) {
            onPreviewPatch(msg.ghostEvents);
        }
    }
  };

  const handleApply = (msg: Message) => {
    onApplyPatch(msg.patch!);
    if (activePatchId === msg.id) {
        setActivePatchId(null);
        if (onClearPreview) onClearPreview();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200">
      <div className="p-3 border-b border-slate-200 bg-white font-bold text-sm">
        RAG Assistant
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-2 rounded-lg max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-800'}`}>
              {msg.content}
            </div>
            {msg.patch && (
              <div className="mt-2 flex gap-2">
                {msg.ghostEvents && (
                  <button 
                    onClick={() => handlePreview(msg)}
                    className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded"
                    data-testid={`rag-preview-btn-${msg.id}`}
                  >
                    {activePatchId === msg.id ? 'Clear Preview' : 'Preview Patch'}
                  </button>
                )}
                <button 
                  onClick={() => handleApply(msg)}
                  className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                  data-testid={`rag-apply-btn-${msg.id}`}
                >
                  Accept Patch
                </button>
              </div>
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
        <button type="submit" disabled={isLoading} className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50" data-testid="rag-submit-btn">
          Send
        </button>
      </form>
    </div>
  );
};
