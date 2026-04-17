import { describe, it, expect, vi } from 'vitest';
import * as PIXI from 'pixi.js';
import { AdvancedRenderer, ASTEvent, Viewport } from '../../src/components/canvas/AdvancedRenderers';

describe('Advanced Canvas Renderers - WebGPU & Shadow DOM', () => {
  it('renders events correctly and creates shadow DOM elements', () => {
    const container = new PIXI.Container();
    const shadowContainer = document.createElement('div');
    const renderer = new AdvancedRenderer(container, shadowContainer);

    const events: ASTEvent[] = [
      { id: '1', type: 'note', style: 'tab', string: 1, startTime: 0, duration: 1 },
      { id: '2', type: 'percussion', style: 'grid', key: 'k', startTime: 1, duration: 1 },
      { id: '3', type: 'sample', style: 'concrete', sampleName: 'bd', startTime: 2, duration: 1 }
    ];

    renderer.renderEvents(events);

    expect(container.children.length).toBeGreaterThanOrEqual(1);
    const graphics = container.children[0] as PIXI.Graphics;
    expect(graphics).toBeInstanceOf(PIXI.Graphics);

    // Verify shadow DOM logic
    expect(shadowContainer.children.length).toBe(3);
    expect(shadowContainer.children[0].getAttribute('aria-label')).toBe('Tab string 1 starting at 0');
    expect(shadowContainer.children[1].getAttribute('aria-label')).toBe('grid event k starting at 1');
    expect(shadowContainer.children[2].getAttribute('aria-label')).toBe('concrete event bd starting at 2');
  });

  it('performs frustum culling via spatial grid and LOD logic', () => {
    const container = new PIXI.Container();
    const shadowContainer = document.createElement('div');
    const renderer = new AdvancedRenderer(container, shadowContainer);

    const events: ASTEvent[] = [];
    for (let i = 0; i < 1000; i++) {
        events.push({
            id: `${i}`,
            type: 'note',
            style: 'standard',
            pitch: 60,
            startTime: i, // 1 quarter note each
            duration: 1
        });
    }

    const viewport: Viewport = { x: 50, y: 0, width: 200, height: 1000 }; 
    // This viewport will only overlap with startTime = 0, 1, 2 (x=0, 100, 200) assuming width spans to 250
    // so roughly 3 events should be visually generated

    renderer.renderEvents(events, 100, viewport, 0.4); // 40% zoom = LOD thermal

    // Only events inside the spatial grid match viewport will be processed
    // In our test it should be a small subset, ensuring frustum culling works
    expect(shadowContainer.children.length).toBeLessThan(15);
    expect(renderer.spatialGrid).toBeDefined();

    renderer.renderEvents(events, 100, viewport, 0.6); // 60% zoom = LOD lines
    renderer.renderEvents(events, 100, viewport, 1.0); // 100% zoom = full block
  });
});

