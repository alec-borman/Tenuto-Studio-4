import { execSync } from 'child_process';

console.log("Vector Delta Initialized: Acoustic Wiring 1049");

try {
  execSync('npx playwright test tests/ui/native_audio_harness.spec.ts', { stdio: 'inherit' });
  console.log("Acoustic Native Worklet Verified");
  process.exit(0);
} catch (e) {
  process.exit(1);
}
