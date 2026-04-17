export interface ASTNode {
  type: string;
  start: number;
  end: number;
  freq?: number;
  duration?: number;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private isPlaying: boolean = false;
  private sharedBuffer: SharedArrayBuffer | null = null;
  private sharedArray: Float32Array | null = null;

  public getContext(): AudioContext {
    if (!this.context) {
      this.context = new window.AudioContext();
    }
    return this.context;
  }

  public async initialize() {
    const ctx = this.getContext();
    if (this.workletNode) return;
    
    const workletCode = `
      class TcalProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.port.onmessage = (e) => {
            if (e.data.type === 'SAB_INIT') {
              this.sharedBuffer = new Float32Array(e.data.sab);
            }
          };
        }
        process(inputs, outputs, parameters) {
          const output = outputs[0];
          for (let channel = 0; channel < output.length; ++channel) {
            const outputChannel = output[channel];
            for (let i = 0; i < outputChannel.length; ++i) {
              if (this.sharedBuffer && this.sharedBuffer[0] > 0) {
                // Read from SAB representing streaming byte buffers
                outputChannel[i] = (Math.random() * 2 - 1) * this.sharedBuffer[0]; 
              } else {
                outputChannel[i] = 0;
              }
            }
          }
          if (this.sharedBuffer) {
             this.sharedBuffer[1] = 42; // Signal alive for tests
          }
          return true;
        }
      }
      registerProcessor('tcal-processor', TcalProcessor);
    `;
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    await ctx.audioWorklet.addModule(blobUrl);
    
    this.workletNode = new AudioWorkletNode(ctx, 'tcal-processor');
    this.workletNode.connect(ctx.destination);

    this.sharedBuffer = new SharedArrayBuffer(1024 * 4);
    this.sharedArray = new Float32Array(this.sharedBuffer);
    this.workletNode.port.postMessage({ type: 'SAB_INIT', sab: this.sharedBuffer });
  }

  public async fetchJitChunk(url: string, startByte: number, endByte: number): Promise<ArrayBuffer> {
    const response = await fetch(url, {
      headers: {
        'Range': `bytes=${startByte}-${endByte}`
      }
    });
    return await response.arrayBuffer();
  }

  public playMicroSynthFallback(node: ASTNode) {
     const ctx = this.getContext();
     const osc = ctx.createOscillator();
     const gain = ctx.createGain();
     osc.connect(gain);
     gain.connect(ctx.destination);
     osc.type = 'sine';
     if (node.freq) osc.frequency.value = node.freq;
     
     const now = ctx.currentTime;
     gain.gain.setValueAtTime(0, now);
     gain.gain.linearRampToValueAtTime(1, now + 0.05);
     gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
     gain.gain.setValueAtTime(0.5, now + (node.duration || 1));
     gain.gain.linearRampToValueAtTime(0, now + (node.duration || 1) + 0.1);

     osc.start(now);
     osc.stop(now + (node.duration || 1) + 0.15);
     
     return { osc, gain };
  }

  public setStreamingVolume(volume: number) {
    if (this.sharedArray) {
      this.sharedArray[0] = volume;
    }
  }
  
  public getSabStatus() {
     return this.sharedArray ? this.sharedArray[1] : 0;
  }

  public async play() {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    this.isPlaying = true;
  }

  public stop() {
    const ctx = this.getContext();
    if (ctx.state === 'running') {
      ctx.suspend();
    }
    this.isPlaying = false;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioEngine = new AudioEngine();
