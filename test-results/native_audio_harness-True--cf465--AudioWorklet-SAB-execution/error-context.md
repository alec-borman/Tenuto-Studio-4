# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: native_audio_harness.spec.ts >> True TCAL Engine Validation in Chromium >> AST-Aware JIT Streaming, micro-synth fallback, and AudioWorklet SAB execution
- Location: tests/ui/native_audio_harness.spec.ts:7:3

# Error details

```
Error: page.evaluate: TypeError: Cannot read properties of undefined (reading 'addModule')
    at AudioEngine.initialize (<anonymous>:76:30)
    at eval (eval at evaluate (:302:30), <anonymous>:21:20)
    at async <anonymous>:328:30
```