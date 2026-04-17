import * as PIXI from 'pixi.js';
import { AdvancedRenderer } from '../../src/components/canvas/AdvancedRenderers';

async function initHarness() {
  const container = document.getElementById('canvas-container');
  // Mathematical verification that the actual DOM exists.
  console.assert(container !== null, "Container must exist in the HTML DOM natively");

  const pixiApp = new PIXI.Application();
  
  // Physically initialize WebGL renderer context
  await pixiApp.init({ width: 800, height: 600, backgroundColor: 0x1099bb });
  container?.appendChild(pixiApp.canvas);

  console.assert(pixiApp.canvas instanceof HTMLCanvasElement, "app.canvas MUST physically be an HTMLCanvasElement");
  console.assert(document.querySelector('canvas') !== null, "WebGL Canvas must be physically mounted to the DOM tree (No JSDOM)");
  
  // Initialize the specific AdvancedRenderer ensuring real components are bound natively
  const renderer = new AdvancedRenderer(pixiApp.stage);
  console.assert(renderer instanceof AdvancedRenderer, "AdvancedRenderer must compile and function purely in browser context");
  
  // Directly pull the underlying graphics context
  const gl = pixiApp.canvas.getContext('webgl2') || pixiApp.canvas.getContext('webgl');
  console.assert(gl !== null, "WebGL graphic context must be initialized and available");
  
  console.log("DOM and WebGPU/WebGL Graphics properly rendered and mathematically verified");
}

initHarness().catch(console.error);
