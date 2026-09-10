import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const IGNORES = ['.next', 'node_modules', '_legacy', '.git'];

function scanDir(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    if (IGNORES.includes(item)) continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(scanDir(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
      files.push({
        path: path.relative(ROOT, fullPath).replace(/\\/g, '/'),
        lines,
      });
    }
  }
  return files;
}

const files = scanDir(ROOT);
files.sort((a, b) => b.lines - a.lines);

console.log('--- Top 20 Largest Active Source Files ---');
for (const f of files.slice(0, 20)) {
  const status = f.lines <= 300 ? '✅ OK' : f.lines <= 400 ? '⚠️ WARN' : '❌ OVER 400';
  console.log(`${f.lines.toString().padStart(4)} lines | ${status} | ${f.path}`);
}

const over400 = files.filter((f) => f.lines > 400);
const over300 = files.filter((f) => f.lines > 300);

console.log('\n--- Summary ---');
console.log(`Total active TypeScript files: ${files.length}`);
console.log(`Files > 400 LOC: ${over400.length}`);
console.log(`Files > 300 LOC: ${over300.length}`);
