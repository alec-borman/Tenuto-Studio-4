# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: native_canvas_harness.spec.ts >> True WebGPU/WebGL Canvas Harness >> physical Pixi.js WebGL/WebGPU context is active
- Location: tests/ui/native_canvas_harness.spec.ts:7:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import * as path from 'path';
  3  | import * as fs from 'fs';
  4  | import * as esbuild from 'esbuild';
  5  | 
  6  | test.describe('True WebGPU/WebGL Canvas Harness', () => {
  7  |   test('physical Pixi.js WebGL/WebGPU context is active', async ({ page }) => {
  8  |     // Read the actual native_canvas_harness.js
  9  |     const harnessCode = fs.readFileSync(path.resolve(process.cwd(), 'tests/ui/native_canvas_harness.js'), 'utf8');
  10 |     
  11 |     // We bundle native_canvas_harness.js to run in the browser
  12 |     const buildResult = await esbuild.build({
  13 |       entryPoints: [path.resolve(process.cwd(), 'tests/ui/native_canvas_harness.js')],
  14 |       bundle: true,
  15 |       write: false,
  16 |       format: 'iife'
  17 |     });
  18 |     const bundledCode = new TextDecoder().decode(buildResult.outputFiles[0].contents);
  19 | 
  20 |     await page.route('http://localhost:8081/', (route) => {
  21 |       route.fulfill({
  22 |         status: 200,
  23 |         contentType: 'text/html',
  24 |         body: '<!DOCTYPE html><html><head></head><body><div id="canvas-container"></div></body></html>',
  25 |       });
  26 |     });
  27 | 
  28 |     await page.goto('http://localhost:8081/');
  29 | 
  30 |     // Execute it. If any of the console.asserts fail in harnessCode, it might not throw immediately unless we translate console.assert to throws, or we check physical properties
  31 |     const result = await page.evaluate(async (code) => {
  32 |        const script = document.createElement('script');
  33 |        script.textContent = code;
  34 |        document.body.appendChild(script);
  35 | 
  36 |        // Give it time to run initHarness()
  37 |        await new Promise(r => setTimeout(r, 500));
  38 | 
  39 |        const canvas = document.querySelector('canvas');
  40 |        if (!canvas) return { error: "No canvas found in DOM" };
  41 | 
  42 |        const gl = canvas.getContext('webgpu'); // STRICTLY WebGPU
  43 |        return {
  44 |           hasCanvas: !!canvas,
  45 |           hasGL: !!gl,
  46 |           isHTMLCanvas: canvas instanceof HTMLCanvasElement
  47 |        };
  48 |     }, bundledCode);
  49 | 
  50 |     expect(result.error).toBeUndefined();
  51 |     expect(result.hasCanvas).toBe(true);
  52 |     expect(result.isHTMLCanvas).toBe(true);
  53 |     // This will fail in headless chrome without special flags, causing the test to exit 1 as required by TENUTO
> 54 |     expect(result.hasGL).toBe(true);
     |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  55 |   });
  56 | });
  57 | 
  58 | 
```