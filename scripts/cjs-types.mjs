// dist/*.d.ts → dist/*.d.cts
// package.json has "type": "module", so every .d.ts is typed as ESM. A CommonJS
// consumer on moduleResolution node16/nodenext that resolves `require` to one
// gets TS1479. Ship a CJS-flavoured twin of each declaration file, with its
// relative specifiers pointing at the twins (`./theme.js` → `./theme.cjs`).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const RELATIVE = /(from\s+|import\s*\(\s*|import\s+)(['"])(\.{1,2}\/[^'"]+?)\.js\2/g;

let count = 0;
for (const file of readdirSync(dist).filter((f) => f.endsWith('.d.ts'))) {
  const src = readFileSync(join(dist, file), 'utf8');
  writeFileSync(join(dist, file.replace(/\.d\.ts$/, '.d.cts')), src.replace(RELATIVE, '$1$2$3.cjs$2'));
  count++;
}
console.log(`wrote ${count} .d.cts files`);
