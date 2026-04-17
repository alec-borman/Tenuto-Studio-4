import { describe, it, expect, vi } from 'vitest';
import * as PIXI from 'pixi.js';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import { AdvancedRenderer, ASTEvent } from '../../src/components/canvas/AdvancedRenderers';
import { RagAssistant, Message } from '../../src/components/panels/RagAssistant';

describe('RAG Ghost Patch WebGPU & UI', () => {
  it('renders ghost events without modifying primary AST', () => {
    const container = new PIXI.Container();
    const renderer = new AdvancedRenderer(container);

    const primaryEvents: ASTEvent[] = [
      { id: '1', type: 'note', style: 'standard', pitch: 60, startTime: 0, duration: 1 }
    ];

    const ghostEvents: ASTEvent[] = [
      { id: 'ghost_1', type: 'note', style: 'standard', pitch: 64, startTime: 1, duration: 1 }
    ];

    renderer.renderEvents(primaryEvents);
    renderer.renderGhostEvents(ghostEvents);

    // Renderer has primaryGraphics and ghostGraphics
    expect(renderer.primaryGraphics).toBeDefined();
    expect(renderer.ghostGraphics).toBeDefined();

    // Primary events length must remain exactly 1, adhering to FATAL CONSTRAINT
    expect(primaryEvents.length).toBe(1);
    expect(primaryEvents[0].id).toBe('1');
    expect(ghostEvents.length).toBe(1);
  });

  it('provides accept patch injection through RAG assistant', async () => {
    const mockOnApply = vi.fn();
    const mockOnPreview = vi.fn();
    const mockOnClear = vi.fn();
    const mockOnQuery = vi.fn().mockImplementation(async (query: string): Promise<Message> => {
        return {
            id: 'msg_1',
            role: 'assistant',
            content: 'I suggest a C major chord patch.',
            patch: 'e:4 g:4',
            ghostEvents: [
              { id: 'ghost_c', type: 'note', style: 'standard', pitch: 60, startTime: 4, duration: 1 }
            ]
        };
    });

    render(
        <RagAssistant 
            editorSelection="c:4"
            onQuery={mockOnQuery}
            onApplyPatch={mockOnApply}
            onPreviewPatch={mockOnPreview}
            onClearPreview={mockOnClear}
        />
    );

    // Submit a query
    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'Add harmony' } });
    fireEvent.click(screen.getByTestId('rag-submit-btn'));

    // Wait for AI response
    await waitFor(() => {
        expect(screen.getByText('I suggest a C major chord patch.')).toBeInTheDocument();
    });

    // Preview Patch
    const previewBtn = screen.getByTestId('rag-preview-btn-msg_1');
    fireEvent.click(previewBtn);
    expect(mockOnPreview).toHaveBeenCalledWith([
        { id: 'ghost_c', type: 'note', style: 'standard', pitch: 60, startTime: 4, duration: 1 }
    ]);
    expect(previewBtn.textContent).toBe('Clear Preview');

    // Accept Patch
    const acceptBtn = screen.getByTestId('rag-apply-btn-msg_1');
    fireEvent.click(acceptBtn);
    expect(mockOnApply).toHaveBeenCalledWith('e:4 g:4');
    expect(mockOnClear).toHaveBeenCalled();
  });
});
