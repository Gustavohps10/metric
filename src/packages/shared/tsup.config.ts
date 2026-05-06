import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/transport/index.ts',
    'src/helpers/index.ts',
    'src/view-models/index.ts',
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
