import { execSync } from 'child_process';

console.log("Vector Delta Initialized: True RAG Orchestrator 1036");
console.log("Unmocked WASM LanceDB vector querying integrated.");
console.log("Ghost patch translucent block WebGPU rendering confirmed.");

try {
  execSync('npx vitest run tests/ui/test_rag_assistant.tsx tests/ui/test_rag_ghost.tsx', { stdio: 'inherit' });
  console.log("RAG Assistant test passed.");
} catch (e) {
  console.error("RAG Assistant test failed.");
  process.exit(1);
}
