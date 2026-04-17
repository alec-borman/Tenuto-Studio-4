import { describe, it, expect } from 'vitest';
import { CommandHistory, TextMutation } from '../../src/editor/CommandHistory';
import { TopologicalMutator } from '../../src/components/canvas/TopologicalMutator';

describe('Topological Mutator & Command History', () => {
    it('translates X-axis drags to metrical displacement', () => {
        const mutator = new TopologicalMutator(100);
        // Event at start 0, dropped at x=50 (0.5 quarter notes = 8th note duration)
        const mutation = mutator.handleXAxisDrag(0, 50, 10);
        
        expect(mutation.offset).toBe(10);
        expect(mutation.length).toBe(0);
        expect(mutation.insertText).toBe('r:8 ');
    });

    it('translates right-edge drags to duration token mutations', () => {
        const mutator = new TopologicalMutator(100);
        // Event at start 0, original duration 1 (x=100) -> drag right edge to x=50 (duration 0.5 -> :8)
        const mutation = mutator.handleRightEdgeDrag(0, 50, 20, 2);
        
        expect(mutation.offset).toBe(20);
        expect(mutation.length).toBe(2); // e.g. replacing ":4"
        expect(mutation.insertText).toBe(':8');
    });

    it('processes CommandHistory with O(1) text diff footprint (undo/redo)', () => {
        const history = new CommandHistory();
        let editorText = "a:4 b:4 c:4";
        
        const applyMutation = (m: TextMutation) => {
            editorText = editorText.slice(0, m.offset) + m.insertText + editorText.slice(m.offset + m.length);
        };

        const command = {
            forward: { offset: 4, length: 3, insertText: "r:8 b:8" },
            reverse: { offset: 4, length: 7, insertText: "b:4" }
        };

        history.execute(command, applyMutation);
        expect(editorText).toBe("a:4 r:8 b:8 c:4");

        const undone = history.undo(applyMutation);
        expect(undone).toBe(true);
        expect(editorText).toBe("a:4 b:4 c:4");

        const redone = history.redo(applyMutation);
        expect(redone).toBe(true);
        expect(editorText).toBe("a:4 r:8 b:8 c:4");
    });
});
