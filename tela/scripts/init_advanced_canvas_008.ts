import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src/components/canvas');
const testsDir = path.join(process.cwd(), 'tests/ui');

fs.mkdirSync(srcDir, { recursive: true });
fs.mkdirSync(testsDir, { recursive: true });

fs.writeFileSync(path.join(srcDir, 'AdvancedRenderers.ts'), `import * as PIXI from 'pixi.js';

export interface ASTEvent {
  id: string;
  type: 'note' | 'percussion' | 'sample';
  style: 'standard' | 'synth' | 'tab' | 'grid' | 'concrete';
  pitch?: number;
  string?: number;
  key?: string;
  sampleName?: string;
  startTime: number;
  duration: number;
}

export class AdvancedRenderer {
  private container: PIXI.Container;

  constructor(container: PIXI.Container) {
    this.container = container;
  }

  public renderEvents(events: ASTEvent[], pixelsPerQuarterNote: number = 100) {
    this.container.removeChildren();

    // To maintain < 16ms latency for 10,000 events, we use a single PIXI.Graphics
    // and draw all shapes into it, which is very fast for batch rendering.
    const graphics = new PIXI.Graphics();
    this.container.addChild(graphics);

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const x = event.startTime * pixelsPerQuarterNote;
      const width = event.duration * pixelsPerQuarterNote;

      if (event.style === 'tab') {
        // Render on Fretboard Grid
        const stringY = (event.string || 1) * 20;
        graphics.rect(x, stringY - 5, width, 10);
        graphics.fill(0x3b82f6);
      } else if (event.style === 'grid' || event.style === 'concrete') {
        // Render on flattened horizontal lanes
        const rowY = 50; // simplified flattened Y
        graphics.rect(x, rowY - 5, width, 10);
        graphics.fill(event.style === 'concrete' ? 0x10b981 : 0xf59e0b);
      } else {
        // Standard piano roll
        const pitchY = 127 - (event.pitch || 60);
        graphics.rect(x, pitchY * 10, width, 10);
        graphics.fill(0x3b82f6);
      }
    }
  }
}
`);

fs.writeFileSync(path.join(testsDir, 'test_advanced_canvas.ts'), `import { describe, it, expect, vi } from 'vitest';
import * as PIXI from 'pixi.js';
import { AdvancedRenderer, ASTEvent } from '../../src/components/canvas/AdvancedRenderers';

describe('Advanced Canvas Renderers', () => {
  it('renders tab, grid, and concrete events correctly', () => {
    const container = new PIXI.Container();
    const renderer = new AdvancedRenderer(container);

    const events: ASTEvent[] = [
      { id: '1', type: 'note', style: 'tab', string: 1, startTime: 0, duration: 1 },
      { id: '2', type: 'percussion', style: 'grid', key: 'k', startTime: 1, duration: 1 },
      { id: '3', type: 'sample', style: 'concrete', sampleName: 'bd', startTime: 2, duration: 1 }
    ];

    renderer.renderEvents(events);

    // The container should have 1 child (the Graphics object)
    expect(container.children.length).toBe(1);
    const graphics = container.children[0] as PIXI.Graphics;
    expect(graphics).toBeInstanceOf(PIXI.Graphics);
  });

  it('maintains performance for 10,000 events', () => {
    const container = new PIXI.Container();
    const renderer = new AdvancedRenderer(container);

    const events: ASTEvent[] = [];
    for (let i = 0; i < 10000; i++) {
      events.push({
        id: \`\${i}\`,
        type: 'note',
        style: 'tab',
        string: (i % 6) + 1,
        startTime: i * 0.25,
        duration: 0.25
      });
    }

    const start = performance.now();
    renderer.renderEvents(events);
    const end = performance.now();

    // Rendering 10,000 events into a single Graphics object should be very fast (< 16ms)
    expect(end - start).toBeLessThan(16);
  });
});
`);
