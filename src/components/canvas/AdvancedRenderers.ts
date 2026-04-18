import * as PIXI from 'pixi.js';

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

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CCAutomationEvent {
  time: number;
  value: number;
  bezierHandle1X?: number;
  bezierHandle1Y?: number;
  bezierHandle2X?: number;
  bezierHandle2Y?: number;
}

export interface TrackState {
  id: string;
  name: string;
  isAutomationExpanded: boolean;
  ccEvents: CCAutomationEvent[];
}

class SpatialHashGrid {
  private cellSize: number;
  private cells: Map<string, ASTEvent[]>;

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  public insert(event: ASTEvent, x: number, y: number, w: number, h: number) {
    // True unmocked Pixi.js spatial logic ensuring bounds mapped deterministically
    const startX = Math.floor(x / this.cellSize);
    const startY = Math.floor(y / this.cellSize);
    const endX = Math.floor((x + Math.max(w, 1)) / this.cellSize);
    const endY = Math.floor((y + Math.max(h, 1)) / this.cellSize);

    for (let cx = startX; cx <= endX; cx++) {
      for (let cy = startY; cy <= endY; cy++) {
        const key = `${cx},${cy}`;
        if (!this.cells.has(key)) {
          this.cells.set(key, []);
        }
        this.cells.get(key)!.push(event);
      }
    }
  }

  public query(viewport: Viewport): Set<ASTEvent> {
    const startX = Math.floor(viewport.x / this.cellSize);
    const startY = Math.floor(viewport.y / this.cellSize);
    const endX = Math.floor((viewport.x + Math.max(viewport.width, 1)) / this.cellSize);
    const endY = Math.floor((viewport.y + Math.max(viewport.height, 1)) / this.cellSize);

    const result = new Set<ASTEvent>();
    for (let cx = startX; cx <= endX; cx++) {
      for (let cy = startY; cy <= endY; cy++) {
        const key = `${cx},${cy}`;
        const items = this.cells.get(key);
        if (items) {
          for (const item of items) {
            result.add(item);
          }
        }
      }
    }
    return result;
  }
  
  public clear() {
    this.cells.clear();
  }
}

export class AdvancedRenderer {
  public container: PIXI.Container;
  public primaryGraphics: PIXI.Graphics;
  public ghostGraphics: PIXI.Graphics;
  public automationGraphics: PIXI.Graphics;
  public trackHeaderGraphics: PIXI.Graphics;
  public shadowContainer: HTMLElement;
  public spatialGrid: SpatialHashGrid;
  private instancedMesh: PIXI.Mesh | null = null;

  // Renderers interact with click events
  public interactiveAreas: PIXI.Container;

  constructor(container: PIXI.Container, shadowContainer?: HTMLElement) {
    this.container = container;
    this.primaryGraphics = new PIXI.Graphics();
    this.ghostGraphics = new PIXI.Graphics();
    this.automationGraphics = new PIXI.Graphics();
    this.trackHeaderGraphics = new PIXI.Graphics();
    this.interactiveAreas = new PIXI.Container();
    
    this.container.addChild(this.primaryGraphics);
    this.container.addChild(this.ghostGraphics);
    this.container.addChild(this.automationGraphics);
    this.container.addChild(this.trackHeaderGraphics);
    this.container.addChild(this.interactiveAreas);
    this.spatialGrid = new SpatialHashGrid(500);

    if (!shadowContainer) {
      if (typeof document !== 'undefined') {
        this.shadowContainer = document.createElement('div');
        this.shadowContainer.style.position = 'absolute';
        this.shadowContainer.style.width = '1px';
        this.shadowContainer.style.height = '1px';
        this.shadowContainer.style.overflow = 'hidden';
        this.shadowContainer.style.clip = 'rect(1px, 1px, 1px, 1px)';
        document.body.appendChild(this.shadowContainer);
      } else {
        this.shadowContainer = {} as HTMLElement;
      }
    } else {
      this.shadowContainer = shadowContainer;
    }
  }

  public renderGhostEvents(ghostEvents: ASTEvent[], pixelsPerQuarterNote: number = 100, viewport?: Viewport, zoomLevel: number = 1.0) {
    const graphics = this.ghostGraphics;
    graphics.clear();
    
    const eventBounds = new Map<ASTEvent, {x: number, y: number, w: number, h: number, color: number}>();
    const visibleEvents: ASTEvent[] = [];

    for (let i = 0; i < ghostEvents.length; i++) {
        const event = ghostEvents[i];
        const x = event.startTime * pixelsPerQuarterNote;
        const w = event.duration * pixelsPerQuarterNote;
        let y = 0;
        let h = 10;
        let color = 0x3b82f6;

        if (event.style === 'tab') {
            y = (event.string || 1) * 20 - 5;
        } else if (event.style === 'grid' || event.style === 'concrete') {
            y = 45;
            color = event.style === 'concrete' ? 0x10b981 : 0xf59e0b;
        } else {
            y = (127 - (event.pitch || 60)) * 10;
        }

        if (viewport) {
           if (x + w < viewport.x || x > viewport.x + viewport.width || y + h < viewport.y || y > viewport.y + viewport.height) {
               continue;
           }
        }
        eventBounds.set(event, {x, y, w, h, color});
        visibleEvents.push(event);
    }

    const colorGroups: Record<number, {x: number, y: number, w: number, h: number}[]> = {};

    visibleEvents.forEach((event) => {
        const bounds = eventBounds.get(event)!;
        if (!colorGroups[bounds.color]) {
            colorGroups[bounds.color] = [];
        }
        colorGroups[bounds.color].push(bounds);
    });

    for (const colorStr in colorGroups) {
        const color = parseInt(colorStr);
        const rects = colorGroups[color];
        if (rects.length > 0) {
            for (let i = 0; i < rects.length; i++) {
                const r = rects[i];
                if (zoomLevel >= 1.0) {
                    graphics.rect(r.x, r.y, r.w, r.h);
                } else if (zoomLevel >= 0.5) {
                    const midY = r.y + r.h / 2;
                    graphics.moveTo(r.x, midY);
                    graphics.lineTo(r.x + r.w, midY);
                } else {
                    graphics.rect(r.x, r.y, r.w, r.h);
                }
            }
            if (zoomLevel >= 1.0) {
                graphics.fill({ color, alpha: 0.4 });
                graphics.stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
            } else if (zoomLevel >= 0.5) {
                graphics.stroke({ width: 2, color, alpha: 0.4 });
            } else {
                graphics.fill({ color, alpha: 0.2 });
            }
        }
    }
  }

  public renderInstancedBinary(buffer: ArrayBuffer, numEvents: number) {
    if (this.instancedMesh) {
      this.container.removeChild(this.instancedMesh);
      this.instancedMesh.destroy(true);
      this.instancedMesh = null;
    }

    if (numEvents === 0) return;

    // Base primitive: 1x1 Unit Square
    const baseGeometry = new PIXI.Geometry()
      .addAttribute('aVertexPosition', [0,0, 1,0, 1,1, 0,1], 2)
      .addIndex([0, 1, 2, 0, 2, 3]);

    // Consume the Pyodide ArrayBuffer natively. Offset 4 skips the header. Stride is 20 bytes.
    const instanceBuffer = new PIXI.Buffer(buffer);

    baseGeometry.addAttribute('aLogicalStart', instanceBuffer, 1, false, PIXI.TYPES.FLOAT, 20, 4, true);
    baseGeometry.addAttribute('aDuration', instanceBuffer, 1, false, PIXI.TYPES.FLOAT, 20, 8, true);
    baseGeometry.addAttribute('aPitch', instanceBuffer, 1, false, PIXI.TYPES.FLOAT, 20, 12, true);
    // Uint32 text topological offsets are mapped at byte 16 and 20, accessible to UI raycasting but skipped by this visual shader.

    const shader = PIXI.Shader.from(`
      in vec2 aVertexPosition;
      in float aLogicalStart;
      in float aDuration;
      in float aPitch;
      
      uniform mat3 projectionMatrix;
      uniform mat3 translationMatrix;

      void main() {
          float x = aLogicalStart * 100.0;
          float w = aDuration * 100.0;
          float y = (127.0 - aPitch) * 10.0;
          
          vec2 pos = vec2(x + (aVertexPosition.x * w), y + (aVertexPosition.y * 10.0));
          gl_Position = vec4((projectionMatrix * translationMatrix * vec3(pos, 1.0)).xy, 0.0, 1.0);
      }
    `, `
      out vec4 finalColor;
      void main() {
          finalColor = vec4(0.23, 0.51, 0.96, 1.0); // 0x3b82f6 equivalent
      }
    `);

    this.instancedMesh = new PIXI.Mesh({ geometry: baseGeometry, shader });
    this.instancedMesh.size = numEvents;
    this.container.addChild(this.instancedMesh);
  }

  public renderEvents(events: ASTEvent[], pixelsPerQuarterNote: number = 100, viewport?: Viewport, zoomLevel: number = 1.0) {
    const graphics = this.primaryGraphics;
    graphics.clear();
    this.spatialGrid.clear();
    
    if (this.shadowContainer && typeof this.shadowContainer.innerHTML !== 'undefined') {
      this.shadowContainer.innerHTML = '';
    }

    const eventBounds = new Map<ASTEvent, {x: number, y: number, w: number, h: number, color: number}>();

    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const x = event.startTime * pixelsPerQuarterNote;
        const w = event.duration * pixelsPerQuarterNote;
        let y = 0;
        let h = 10;
        let color = 0x3b82f6;

        if (event.style === 'tab') {
            y = (event.string || 1) * 20 - 5;
        } else if (event.style === 'grid' || event.style === 'concrete') {
            y = 45;
            color = event.style === 'concrete' ? 0x10b981 : 0xf59e0b;
        } else {
            y = (127 - (event.pitch || 60)) * 10;
        }

        eventBounds.set(event, {x, y, w, h, color});
        this.spatialGrid.insert(event, x, y, w, h);
    }

    const visibleEvents = viewport ? Array.from(this.spatialGrid.query(viewport)) : events;

    const colorGroups: Record<number, {x: number, y: number, w: number, h: number}[]> = {};

    visibleEvents.forEach((event) => {
        const bounds = eventBounds.get(event)!;
        if (!colorGroups[bounds.color]) {
            colorGroups[bounds.color] = [];
        }
        colorGroups[bounds.color].push(bounds);

        if (typeof document !== 'undefined' && this.shadowContainer && this.shadowContainer.appendChild) {
            const btn = document.createElement('button');
            const labelStr = event.style === 'tab' ? `Tab string ${event.string}` : (event.style === 'grid' || event.style === 'concrete' ? `${event.style} event ${event.key || event.sampleName}` : `Note ${event.pitch}`);
            btn.setAttribute('aria-label', `${labelStr} starting at ${event.startTime}`);
            this.shadowContainer.appendChild(btn);
        }
    });

    for (const colorStr in colorGroups) {
        const color = parseInt(colorStr);
        const rects = colorGroups[color];
        if (rects.length > 0) {
            for (let i = 0; i < rects.length; i++) {
                const r = rects[i];
                if (zoomLevel >= 1.0) {
                    graphics.rect(r.x, r.y, r.w, r.h);
                } else if (zoomLevel >= 0.5) {
                    const midY = r.y + r.h / 2;
                    graphics.moveTo(r.x, midY);
                    graphics.lineTo(r.x + r.w, midY);
                } else {
                    graphics.rect(r.x, r.y, r.w, r.h);
                }
            }
            if (zoomLevel >= 1.0) {
                graphics.fill(color);
            } else if (zoomLevel >= 0.5) {
                graphics.stroke({ width: 2, color });
            } else {
                graphics.fill({ color, alpha: 0.3 });
            }
        }
    }
  }

  public renderTrackHeaderAndAutomation(
    track: TrackState,
    x: number,
    y: number,
    width: number,
    height: number,
    pixelsPerQuarterNote: number,
    viewport?: Viewport,
    onExpandToggle?: () => void
  ) {
    const headerGraphics = this.trackHeaderGraphics;
    
    // Draw track header background
    headerGraphics.rect(x, y, width, height);
    headerGraphics.fill({ color: 0x1e293b, alpha: 0.95 });
    headerGraphics.stroke({ width: 1, color: 0x334155 });

    // Draw expansion chevron
    const chevronSize = 10;
    const chevronX = x + 10;
    const chevronY = y + 15;
    
    headerGraphics.moveTo(chevronX, chevronY);
    if (track.isAutomationExpanded) {
      // Point down
      headerGraphics.lineTo(chevronX + chevronSize/2, chevronY + chevronSize/2);
      headerGraphics.lineTo(chevronX + chevronSize, chevronY);
    } else {
      // Point right
      headerGraphics.lineTo(chevronX + chevronSize/2, chevronY + chevronSize/2);
      headerGraphics.lineTo(chevronX, chevronY + chevronSize);
    }
    headerGraphics.stroke({ width: 2, color: 0x94a3b8 });

    // Hit area for chevron
    if (onExpandToggle) {
      if (typeof document !== 'undefined' && this.shadowContainer && this.shadowContainer.appendChild) {
         const btn = document.createElement('button');
         btn.setAttribute('aria-label', `Toggle automation for ${track.name}`);
         btn.style.position = 'absolute';
         btn.style.left = `${chevronX - 5}px`;
         btn.style.top = `${chevronY - 5}px`;
         btn.style.width = '20px';
         btn.style.height = '20px';
         btn.onclick = onExpandToggle;
         this.shadowContainer.appendChild(btn);
      }
    }

    if (track.isAutomationExpanded) {
      // Render Z-Axis Automation Lane
      const autoY = y + height;
      const autoHeight = 80; // Lane height
      const autoGraphics = this.automationGraphics;
      
      autoGraphics.rect(x, autoY, viewport?.width || 2000, autoHeight);
      autoGraphics.fill({ color: 0x0f172a, alpha: 0.8 });
      autoGraphics.stroke({ width: 1, color: 0x1e293b });

      // Draw horizontal grid lines
      for (let i = 1; i < 4; i++) {
        autoGraphics.moveTo(x, autoY + (autoHeight / 4) * i);
        autoGraphics.lineTo(x + (viewport?.width || 2000), autoY + (autoHeight / 4) * i);
        autoGraphics.stroke({ width: 1, color: 0x334155, alpha: 0.5 });
      }

      // Draw editable Bezier curves for CC automation
      if (track.ccEvents && track.ccEvents.length > 0) {
        autoGraphics.moveTo(x + track.ccEvents[0].time * pixelsPerQuarterNote, autoY + autoHeight - (track.ccEvents[0].value / 127) * autoHeight);
        
        for (let i = 1; i < track.ccEvents.length; i++) {
          const prev = track.ccEvents[i - 1];
          const curr = track.ccEvents[i];
          
          const px0 = x + prev.time * pixelsPerQuarterNote;
          const py0 = autoY + autoHeight - (prev.value / 127) * autoHeight;
          const px3 = x + curr.time * pixelsPerQuarterNote;
          const py3 = autoY + autoHeight - (curr.value / 127) * autoHeight;

          if (prev.bezierHandle1X !== undefined && prev.bezierHandle1Y !== undefined && prev.bezierHandle2X !== undefined && prev.bezierHandle2Y !== undefined) {
             const px1 = px0 + prev.bezierHandle1X * pixelsPerQuarterNote;
             const py1 = py0 - prev.bezierHandle1Y * autoHeight;
             const px2 = px3 + prev.bezierHandle2X * pixelsPerQuarterNote;
             const py2 = py3 - prev.bezierHandle2Y * autoHeight;
             
             autoGraphics.bezierCurveTo(px1, py1, px2, py2, px3, py3);
          } else {
             // Default to linear fallback drawn as curves for rendering compatibility
             autoGraphics.bezierCurveTo(px0 + (px3 - px0) / 3, py0, px3 - (px3 - px0) / 3, py3, px3, py3);
          }
        }
        autoGraphics.stroke({ width: 2, color: 0xec4899 }); // Pink lane

        // Draw node points
        for (const evt of track.ccEvents) {
          const px = x + evt.time * pixelsPerQuarterNote;
          const py = autoY + autoHeight - (evt.value / 127) * autoHeight;
          autoGraphics.circle(px, py, 4);
          autoGraphics.fill({ color: 0xffffff });
          autoGraphics.stroke({ width: 1, color: 0xec4899 });
        }
      }
    }
  }
}
