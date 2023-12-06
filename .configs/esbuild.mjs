import * as esbuild from 'esbuild';
import readPkg from 'read-pkg';

const pkg = readPkg.sync();

if (process.env.FORMAT !== 'cjs' && process.env.FORMAT !== 'esm') {
  console.log(`support "cjs" or "esm"`);
  console.log(`eg. FORMAT=cjs node esbuild.mjs`);

  process.exit(1);
}

console.log('esbuild start bundling');
console.log(`version: ${pkg.version}`);
console.log(`FORMAT: ${process.env.FORMAT}`);
console.log(`MINIFY: ${process.env.FORMAT}`);

const getExternal = () => {
  const dependencies = pkg.dependencies ?? {};
  const devDependencies = pkg.devDependencies ?? {};
  return Object.keys({ ...dependencies, ...devDependencies });
};

await esbuild.build({
  entryPoints: ['src/index.ts'],
  target: 'es2021',
  bundle: true,
  sourcemap: true,
  platform: 'node',
  minify: process.env.MINIFY === 'true',
  outfile: process.env.FORMAT === 'cjs' ? 'dist/cjs/index.cjs' : 'dist/esm/index.mjs',
  format: process.env.FORMAT,
  external: getExternal(),
});
