import { test, expect } from '@playwright/test';
import * as fs from 'fs';
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
    const code = new TextDecoder().decode(buildResult.outputFiles[0].contents);

    await page.route('http://localhost:8080/', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!DOCTYPE html><html><head></head><body></body></html>',
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        }
      });
    });

    await page.goto('http://localhost:8080/');

    await page.evaluate(async (bundledCode) => {
      const script = document.createElement('script');
      script.textContent = bundledCode;
      document.body.appendChild(script);
    }, code);
  }

  test('asserts SharedArrayBuffer IPC memory allocation', async ({ page }) => {
    await injectAudioEngine(page);
    const sabMutated = await page.evaluate(async () => {
      const engine = window['AudioEngineModule'].audioEngine;
      await engine.initialize();
      await new Promise(r => setTimeout(r, 100)); // allow audio thread to run and update SAB
      return engine.getSabStatus() === 42;
    });
    expect(sabMutated).toBe(true);
  });

  test('asserts AudioWorkletNode mounting and micro-synth fallback', async ({ page }) => {
    await injectAudioEngine(page);
    const result = await page.evaluate(async () => {
      const engine = window['AudioEngineModule'].audioEngine;
      await engine.initialize();
      const fallback = engine.playMicroSynthFallback({ type: 'note', start: 0, end: 1, freq: 440 });
      return {
        state: engine.getContext().state,
        hasWorklet: !!engine.workletNode,
        hasFallbackOsc: !!fallback.osc,
        hasFallbackGain: !!fallback.gain
      };
    });
    
    expect(result.state).toBe('running');
    expect(result.hasWorklet).toBe(true);
    expect(result.hasFallbackOsc).toBe(true);
    expect(result.hasFallbackGain).toBe(true);
  });

  test('intercepts fetch API to prove JIT byte-range headers', async ({ page }) => {
    await injectAudioEngine(page);
    const rangeHeader = await page.evaluate(async () => {
      const engine = window['AudioEngineModule'].audioEngine;
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
