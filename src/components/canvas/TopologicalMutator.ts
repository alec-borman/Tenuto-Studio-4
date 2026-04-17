import { TextMutation } from '../../editor/CommandHistory';

export enum InteractionState {
  IDLE = 0,
  ARMED = 1,
  DRAGGING = 2,
  COMMIT_PENDING = 3,
  COMMITTED = 4
}

export class TopologicalMutator {
  private pixelsPerQuarterNote: number;
  private currentState: InteractionState = InteractionState.IDLE;
  private dragStartX: number = 0;
  private currentDragX: number = 0;
  private rafId: number | null = null;
  private pendingMutation: TextMutation | null = null;
  
  // Callback when visual state needs updating during drag
  public onVisualUpdate?: (deltaX: number) => void;
  // Callback when a mutation needs to be committed to Monaco
  public onCommit?: (mutation: TextMutation) => void;

  constructor(pixelsPerQuarterNote: number = 100) {
    this.pixelsPerQuarterNote = pixelsPerQuarterNote;
  }

  public getState(): InteractionState {
    return this.currentState;
  }

  // Step 1: Mouse down arms the state machine
  public initiateDrag(startX: number) {
    if (this.currentState !== InteractionState.IDLE && this.currentState !== InteractionState.COMMITTED) return;
    this.currentState = InteractionState.ARMED;
    this.dragStartX = startX;
    this.currentDragX = startX;
  }

  // Step 2 & 3: Mouse move visually detaches and updates via rAF (zero-latency)
  public updateDrag(mouseX: number, currentStartTime: number, textOffset: number, isRightEdge: boolean = false, currentDurationLength: number = 0) {
    if (this.currentState !== InteractionState.ARMED && this.currentState !== InteractionState.DRAGGING) return;
    
    // Transition to dragging if moved beyond threshold (e.g., 2 pixels)
    if (this.currentState === InteractionState.ARMED) {
      if (Math.abs(mouseX - this.dragStartX) > 2) {
        this.currentState = InteractionState.DRAGGING;
      } else {
        return;
      }
    }

    this.currentDragX = mouseX;

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        if (this.currentState !== InteractionState.DRAGGING) return;
        
        const deltaX = this.currentDragX - this.dragStartX;
        
        // Notify visual layer to detach and translate block
        if (this.onVisualUpdate) {
          this.onVisualUpdate(deltaX);
        }

        // Calculate pending mutation WITHOUT applying it to Monaco
        if (isRightEdge) {
          this.pendingMutation = this.calculateRightEdgeMutation(currentStartTime, this.currentDragX, textOffset, currentDurationLength);
        } else {
          this.pendingMutation = this.calculateXAxisMutation(currentStartTime, this.currentDragX, textOffset);
        }
      });
    }
  }

  // Step 4: Mouse up triggers commit pending
  public finalizeDrag() {
    if (this.currentState !== InteractionState.DRAGGING) {
      this.currentState = InteractionState.IDLE;
      return;
    }

    this.currentState = InteractionState.COMMIT_PENDING;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Step 5: Commit to Monaco strictly on mouse up
    if (this.pendingMutation && this.onCommit) {
      this.onCommit(this.pendingMutation);
    }
    
    this.pendingMutation = null;
    this.currentState = InteractionState.COMMITTED;
    
    // Reset back to idle shortly after
    setTimeout(() => {
      this.currentState = InteractionState.IDLE;
    }, 10);
  }

  public cancelDrag() {
    this.currentState = InteractionState.IDLE;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingMutation = null;
    if (this.onVisualUpdate) {
      // Revert visual translation
      this.onVisualUpdate(0);
    }
  }

  private calculateXAxisMutation(currentStartTime: number, dropX: number, textOffset: number): TextMutation {
    const newStartTime = dropX / this.pixelsPerQuarterNote;
    const shift = newStartTime - currentStartTime;
    
    if (shift > 0) {
      const restValue = Math.round(4 / shift);
      return {
        offset: textOffset,
        length: 0,
        insertText: `r:${restValue} `
      };
    } else {
      return { offset: textOffset, length: 0, insertText: '' };
    }
  }

  private calculateRightEdgeMutation(currentStartTime: number, newEdgeX: number, textOffset: number, currentDurationTokenLength: number): TextMutation {
    const newDuration = (newEdgeX / this.pixelsPerQuarterNote) - currentStartTime;
    const durationFraction = Math.max(1, Math.round(4 / newDuration));
    
    return {
      offset: textOffset,
      length: currentDurationTokenLength,
      insertText: `:${durationFraction}`
    };
  }

  // Legacy entrypoints adapted
  public handleXAxisDrag(currentStartTime: number, dropX: number, textOffset: number): TextMutation {
    return this.calculateXAxisMutation(currentStartTime, dropX, textOffset);
  }

  public handleRightEdgeDrag(currentStartTime: number, newEdgeX: number, textOffset: number, currentDurationTokenLength: number): TextMutation {
    return this.calculateRightEdgeMutation(currentStartTime, newEdgeX, textOffset, currentDurationTokenLength);
  }
}
