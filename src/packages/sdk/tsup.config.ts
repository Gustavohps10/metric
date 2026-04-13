import { defineConfig } from 'tsup'

import pkg from './package.json'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
  },
  clean: true,
  sourcemap: true,
  splitting: true,
  tsconfig: './tsconfig.build.json',
  noExternal: [
    '@metric-org/application',
    '@metric-org/cross-cutting',
    '@metric-org/domain',
    '@metric-org/presentation',
  ],
  define: {
    __SDK_VERSION__: JSON.stringify(pkg.version),
  },
})
