// Builds dist/: JS in three formats + CSS bundle, minified copy, tokens-only CSS.
import { build } from 'esbuild';
import { mkdirSync, rmSync, copyFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const banner = `/*! fernwell v${pkg.version} | MIT | https://github.com/JacobKnaack/fernwell */`;
const shared = {
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ['es2019'],
  legalComments: 'none',
  define: { __FW_VERSION__: JSON.stringify(pkg.version) },
  banner: { js: banner, css: banner },
  logLevel: 'info',
};

// `version` is exported as the string '__FW_VERSION__' in source; esbuild's
// `define` only replaces identifiers, so swap the literal here.
const versionPlugin = {
  name: 'fw-version',
  setup(b) {
    b.onLoad({ filter: /src[\\/]js[\\/]index\.ts$/ }, (args) => ({
      contents: readFileSync(args.path, 'utf8').replace("'__FW_VERSION__'", JSON.stringify(pkg.version)),
      loader: 'ts',
    }));
  },
};

const js = (entry, format, outfile, extra = {}) =>
  build({ ...shared, entryPoints: [join(root, entry)], format, outfile: join(dist, outfile), plugins: [versionPlugin], ...extra });

await Promise.all([
  js('src/js/index.ts', 'esm', 'fernwell.esm.js'),
  js('src/js/index.ts', 'cjs', 'fernwell.cjs'),
  js('src/js/iife.ts', 'iife', 'fernwell.iife.js', { globalName: 'Fernwell', footer: { js: 'Fernwell=Fernwell.default;' } }),
  build({ ...shared, minify: false, entryPoints: [join(root, 'src/css/index.css')], outfile: join(dist, 'fernwell.css') }),
  build({ ...shared, entryPoints: [join(root, 'src/css/index.css')], outfile: join(dist, 'fernwell.min.css') }),
  build({ ...shared, minify: false, entryPoints: [join(root, 'src/css/tokens.css')], outfile: join(dist, 'fernwell.tokens.css') }),
]);

copyFileSync(join(root, 'src/tokens/tokens.json'), join(dist, 'tokens.json'));
console.log('build complete');
