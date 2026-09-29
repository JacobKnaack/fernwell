import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import ts from 'typescript';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Type-checks small consumer projects against the built package, the way a
// real install sees it: fernwell lives in node_modules and is resolved through
// its `exports` / `typesVersions`. Needs `dist/` — `npm run test:types` builds first.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const fixtures = join(root, '__tests__/fixtures');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

let sandbox: string;

/** A consumer project whose node_modules/fernwell is the package under test (or a doctored copy). */
function consumer(name: string, install: (dir: string) => void): string {
  const dir = join(sandbox, name);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  install(join(dir, 'node_modules/fernwell'));
  return dir;
}

function typecheck(dir: string, files: string[], options: ts.CompilerOptions): string[] {
  for (const f of files) cpSync(join(fixtures, f), join(dir, f));
  const program = ts.createProgram(
    files.map((f) => join(dir, f)),
    { strict: true, noEmit: true, skipLibCheck: false, target: ts.ScriptTarget.ES2020, lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'], types: [], ...options },
  );
  return ts.getPreEmitDiagnostics(program).map((d) => {
    const at = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0;
    const where = d.file ? `${d.file.fileName.replace(sandbox, '')}:${at}: ` : '';
    return `${where}TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`;
  });
}

beforeAll(() => {
  if (!existsSync(join(dist, 'index.d.cts'))) throw new Error('dist/ is missing or stale — run `npm run test:types` (it builds first).');
  sandbox = mkdtempSync(join(tmpdir(), 'fernwell-types-'));
});

afterAll(() => rmSync(sandbox, { recursive: true, force: true }));

describe('built package layout', () => {
  const typePaths = (node: unknown): string[] =>
    node && typeof node === 'object'
      ? Object.entries(node).flatMap(([k, v]) => (k === 'types' && typeof v === 'string' ? [v] : typePaths(v)))
      : [];

  it('every `types` target in the exports map exists', () => {
    const targets = typePaths(pkg.exports);
    expect(targets.length).toBeGreaterThan(0);
    for (const t of targets) expect(existsSync(join(root, t)), t).toBe(true);
  });

  it('every typesVersions target exists', () => {
    for (const paths of Object.values<string[]>(pkg.typesVersions['*'])) {
      for (const p of paths) expect(existsSync(join(root, p)), p).toBe(true);
    }
  });

  it('`import` and `require` resolve to different declaration files (.d.ts vs .d.cts)', () => {
    expect(pkg.exports['.'].import.types).toMatch(/\.d\.ts$/);
    expect(pkg.exports['.'].require.types).toMatch(/\.d\.cts$/);
  });

  it('every .d.ts has a .d.cts twin whose relative imports point at twins, not ESM files', () => {
    const esm = readdirSync(dist).filter((f) => f.endsWith('.d.ts'));
    expect(esm.length).toBeGreaterThan(0);
    for (const f of esm) {
      const twin = join(dist, f.replace(/\.d\.ts$/, '.d.cts'));
      expect(existsSync(twin), twin).toBe(true);
      expect(readFileSync(twin, 'utf8')).not.toMatch(/from\s+['"]\.{1,2}\/[^'"]+\.js['"]/);
    }
  });
});

describe('consumer type-checking (built package)', () => {
  const link = (dir: string) => symlinkSync(root, dir, 'dir');

  it.each([
    ['node16', ts.ModuleKind.Node16, ts.ModuleResolutionKind.Node16],
    ['nodenext', ts.ModuleKind.NodeNext, ts.ModuleResolutionKind.NodeNext],
  ])('%s: an ESM file and a CommonJS file both type-check', (name, module, moduleResolution) => {
    const dir = consumer(name, link);
    expect(typecheck(dir, ['esm.mts', 'cjs.cts'], { module, moduleResolution })).toEqual([]);
  });

  it('bundler: type-checks, including the CSS subpath imports', () => {
    const dir = consumer('bundler', link);
    const problems = typecheck(dir, ['plain.ts'], { module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler });
    expect(problems).toEqual([]);
  });

  it('node10 (ignores `exports`): type-checks, CSS subpaths resolved via typesVersions', () => {
    const dir = consumer('node10', link);
    const problems = typecheck(dir, ['plain.ts'], { module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10 });
    expect(problems).toEqual([]);
  });
});

describe('the checks can fail', () => {
  it('reports ordinary type errors', () => {
    const dir = consumer('sanity', (d) => symlinkSync(root, d, 'dir'));
    writeFileSync(join(dir, 'broken.ts'), `import { tokens } from 'fernwell';\nconst n: number = tokens.getToken('primary');\nexport { n };\n`);
    const program = ts.createProgram([join(dir, 'broken.ts')], {
      strict: true, noEmit: true, skipLibCheck: true, types: [], module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    });
    expect(ts.getPreEmitDiagnostics(program).map((d) => d.code)).toContain(2322);
  });

  it('catches the original bug: one ESM `types` entry for both `import` and `require` breaks a CJS consumer (TS1479)', () => {
    const dir = consumer('regression', (d) => {
      mkdirSync(d, { recursive: true });
      cpSync(dist, join(d, 'dist'), { recursive: true });
      const old = { ...pkg, exports: { ...pkg.exports, '.': { types: './dist/index.d.ts', import: './dist/fernwell.esm.js', require: './dist/fernwell.cjs' } } };
      writeFileSync(join(d, 'package.json'), JSON.stringify(old));
    });
    const problems = typecheck(dir, ['cjs.cts'], { module: ts.ModuleKind.Node16, moduleResolution: ts.ModuleResolutionKind.Node16 });
    expect(problems.some((p) => p.includes('TS1479'))).toBe(true);
  });
});
