import fs from 'fs';

const path = 'diff_output.txt';
if (fs.existsSync(path)) {
  const content = fs.readFileSync(path, 'utf8');
  const lines = content.split('\n');
  const cleanLines = lines.filter(line => {
    return !(line.startsWith('--- src/') || line.startsWith('+++ src/'));
  });
  fs.writeFileSync('clean_diff.txt', cleanLines.join('\n'));
  console.log('Clean diff written successfully.');
} else {
  console.warn('No diff_output.txt found to clean.');
}
