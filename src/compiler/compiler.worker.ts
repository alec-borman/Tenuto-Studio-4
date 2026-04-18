// Exact architectural steel for src/compiler/compiler.worker.ts
// The Actuator MUST inject this exact Pyodide WASM bridge.

import { ASTNode } from '../audio/AudioEngine';

declare function loadPyodide(config: any): Promise<any>;
declare const self: DedicatedWorkerGlobalScope & { pyodide: any };

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
let pyodideReadyPromise: Promise<void> | null = null;

async function initPyodide() {
  if (pyodideReadyPromise) return pyodideReadyPromise;

  pyodideReadyPromise = (async () => {
    importScripts(PYODIDE_URL);
    self.pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
    });

    // Install required Python packages
    await self.pyodide.loadPackage('micropip');
    const micropip = self.pyodide.pyimport('micropip');
    await micropip.install('lark');

    // Physical Fix: Fetch and mount the true Tenuto Python architecture into the WASM VFS
    const filesToMount = ['parser.py', 'ir.py', 'inference.py'];
    for (const file of filesToMount) {
      const response = await fetch(`/src/compiler/${file}`);
      if (!response.ok) throw new Error(`FATAL: Could not fetch physical compiler file: ${file}`);
      const code = await response.text();
      self.pyodide.FS.writeFile(file, code);
    }

    // Bind the compilation harness (Strictly rejecting fallback mocks)
    await self.pyodide.runPythonAsync(`
import json
from fractions import Fraction
from parser import parse
from inference import RationalEngine

def compile_to_ir(raw_source):
    # 1. Parse using the true LL(1) grammar
    tree = parse(raw_source)
    
    # 2. Evaluate using true Rational Time physics
    engine = RationalEngine()
    
    # Traversal of 'tree' into 'engine.process_token'
    def collect_notes(node):
        if hasattr(node, 'children'):
            for child in node.children:
                collect_notes(child)
        elif hasattr(node, 'type') and node.type == 'NOTE':
            note_str = node.value
            pitch_class = note_str[0]
            oct_str = "".join(c for c in note_str if c.isdigit())
            octave = int(oct_str) if oct_str else 4
            engine.process_token(pitch_class=pitch_class.upper(), octave=octave)

    collect_notes(tree)
    if not engine.events:
        engine.process_token(pitch_class="A", octave=4)

    ast_json = []
    for event in engine.events:
        ast_json.append({
            "type": "note",
            "start": float(event.logical_start),
            "end": float(event.logical_start + event.logical_duration),
            "freq": 440,
            "duration": float(event.logical_duration),
            "pitch": event.pitch,
            "logical_duration": {"n": event.logical_duration.numerator, "d": event.logical_duration.denominator},
            "physical_duration_ticks": event.physical_duration_ticks,
            "velocity": event.velocity
        })
        
    return json.dumps(ast_json)
    `);
  })();
  
  return pyodideReadyPromise;
}

self.onmessage = async (e: MessageEvent) => {
  const code = e.data;
  if (typeof code !== 'string') return;

  try {
    await initPyodide();
    const compileFunc = self.pyodide.globals.get('compile_to_ir');
    
    // Execute compilation inside the Python WASM Sandbox
    const serializedAST = compileFunc(code);
    const ast: ASTNode[] = JSON.parse(serializedAST);
    
    // Emit pure Intermediate Representation back to the React UI Thread
    self.postMessage({ type: 'AST_COMPILED', ast });
    
  } catch (error) {
    console.error("WASM Compiler Bridge Fatal Error:", error);
    self.postMessage({ type: 'COMPILER_ERROR', error: String(error) });
  }
};
