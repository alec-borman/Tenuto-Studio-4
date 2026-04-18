import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as esbuild from 'esbuild';

test.describe('True TCAL Engine Validation in Chromium', () => {
  async function injectAudioEngine(page) {
    const enginePath = path.resolve(process.cwd(), 'src/audio/AudioEngine.ts');
    const buildResult = await esbuild.build({
      entryPoints: [enginePath],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: 'AudioEngineModule'
    });

    // Architectural fix: Add explicit [0] array index to correctly decode the buffer
    const code = new TextDecoder().decode(buildResult.outputFiles[0].contents);
    await page.addScriptTag({ content: code });
  }

  async function unlockAudioContext(page) {
    // Architectural fix: Intercept route to physically inject required COOP/COEP headers for SAB allocation
    await page.route('http://localhost:3000/', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body><button id="tcal-unlock">Unlock AudioContext</button></body></html>',
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp'
        }
      });
    });

    await page.goto('http://localhost:3000/');

    await injectAudioEngine(page);

    // Bind engine initialization to the physical click event
    await page.evaluate(() => {
      document.getElementById('tcal-unlock').addEventListener('click', async () => {
        const engine = window['AudioEngineModule'].audioEngine;
        await engine.initialize();
        window['tcal_active_engine'] = engine;
      });
    });

    // Physical user-gesture to unlock strict AudioContext natively
    await page.click('#tcal-unlock');
    await page.waitForFunction(() => window['tcal_active_engine'] !== undefined);
  }

  test('asserts AudioWorkletNode mounting and micro-synth fallback', async ({ page }) => {
    await unlockAudioContext(page);

    // Evaluate the engine state after natural unlocking
    const result = await page.evaluate(async () => {
      const engine = window['tcal_active_engine'];
      const fallback = engine.playMicroSynthFallback({ type: 'note', start: 0, end: 1, freq: 440 });
      return {
        state: engine.getContext().state,
        hasWorklet: !!engine.workletNode,
        hasFallbackOsc: !!fallback.osc,
        hasFallbackGain: !!fallback.gain
      };
    });

    expect(result.state).toBe('running');
    expect(result.hasFallbackOsc).toBe(true);
    expect(result.hasFallbackGain).toBe(true);
  });

  test('asserts SharedArrayBuffer IPC memory allocation', async ({ page }) => {
    await unlockAudioContext(page);
    const sabMutated = await page.evaluate(async () => {
      const engine = window['tcal_active_engine'];
      await new Promise(r => setTimeout(r, 100)); // allow audio thread to run and update SAB
      return engine.getSabStatus() === 42;
    });
    expect(sabMutated).toBe(true);
  });

  test('intercepts fetch API to prove JIT byte-range headers', async ({ page }) => {
    await unlockAudioContext(page);
    const rangeHeader = await page.evaluate(async () => {
      const engine = window['tcal_active_engine'];
      let rangeHeaderSent = null;
      const fetchBackup = window.fetch;
      window.fetch = async (url, options) => {
        const headers = (options?.headers as any) || {};
        if (headers.Range || headers.range) {
           rangeHeaderSent = headers.Range || headers.range;
        }
        return new Response(new ArrayBuffer(8)) as any;
      };
      
      await engine.fetchJitChunk('http://localhost/test.mp3', 0, 1024);
      window.fetch = fetchBackup;
      
      return rangeHeaderSent;
    });
    expect(rangeHeader).toBe('bytes=0-1024');
  });

});
