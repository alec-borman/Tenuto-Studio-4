import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as esbuild from 'esbuild';

test.describe('True WebGPU/WebGL Canvas Harness', () => {
  test('physical Pixi.js WebGL/WebGPU context is active', async ({ page }) => {
    // Read the actual native_canvas_harness.js
    const harnessCode = fs.readFileSync(path.resolve(process.cwd(), 'tests/ui/native_canvas_harness.js'), 'utf8');
    
    // We bundle native_canvas_harness.js to run in the browser
    const buildResult = await esbuild.build({
      entryPoints: [path.resolve(process.cwd(), 'tests/ui/native_canvas_harness.js')],
      bundle: true,
      write: false,
      format: 'iife'
    });
    const bundledCode = new TextDecoder().decode(buildResult.outputFiles[0].contents);

    await page.route('http://localhost:8081/', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!DOCTYPE html><html><head></head><body><div id="canvas-container"></div></body></html>',
      });
    });

    await page.goto('http://localhost:8081/');

    // Execute it. If any of the console.asserts fail in harnessCode, it might not throw immediately unless we translate console.assert to throws, or we check physical properties
    const result = await page.evaluate(async (code) => {
       const script = document.createElement('script');
       script.textContent = code;
       document.body.appendChild(script);

       // Give it time to run initHarness()
       await new Promise(r => setTimeout(r, 500));

       const canvas = document.querySelector('canvas');
       if (!canvas) return { error: "No canvas found in DOM" };

       const gl = canvas.getContext('webgpu'); // STRICTLY WebGPU
       return {
          hasCanvas: !!canvas,
          hasGL: !!gl,
          isHTMLCanvas: canvas instanceof HTMLCanvasElement
       };
    }, bundledCode);

    expect(result.error).toBeUndefined();
    expect(result.hasCanvas).toBe(true);
    expect(result.isHTMLCanvas).toBe(true);
    // This will fail in headless chrome without special flags, causing the test to exit 1 as required by TENUTO
    expect(result.hasGL).toBe(true);
  });
});

