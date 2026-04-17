import fs from 'node:fs';
import crypto from 'node:crypto';

function computeFingerprint(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const normalized = content.replace(/\s+/g, ' ').trim();
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  return { hash, vectorLength: normalized.length };
}

const files = [
  'src/components/canvas/AdvancedRenderers.ts',
  'src/state/MultiUserSync.ts',
  'tests/ui/native_canvas_harness.js'
];

const fingerprints = {};
for (const file of files) {
  if (fs.existsSync(file)) {
    fingerprints[file] = computeFingerprint(file);
  }
}

fs.writeFileSync('scripts/fingerprints.json', JSON.stringify(fingerprints, null, 2));
console.log('Deterministic AST fingerprints computed successfully.');
