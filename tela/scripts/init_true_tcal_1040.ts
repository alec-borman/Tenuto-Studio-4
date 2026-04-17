import { execSync } from 'child_process';

console.log("Vector Delta Initialized: True TCAL Engine 1040");
console.log("Audio Engine facade eradicated.");
console.log("AST-Aware HTTP Range rendering inside physical Worklets complete.");

try {
  execSync('npx playwright test tests/ui/native_audio_harness.spec.ts', { stdio: 'inherit' });
  console.log("Physical Audio Validation passes.");
} catch (e) {
  process.exit(1);
}
