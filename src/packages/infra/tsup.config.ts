import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/auth/index.ts',
    'src/contracts/index.ts',
    'src/http/index.ts',
    'src/tools/index.ts',
    'src/sync/index.ts',
    'src/data/index.ts',
    'src/facades/index.ts',
    'src/workflow/index.ts',
  ],
  format: ['esm'],
  dts: {
    resolve: true,
  },
  clean: true,
  sourcemap: true,
  splitting: true,
  tsconfig: './tsconfig.build.json',
})
