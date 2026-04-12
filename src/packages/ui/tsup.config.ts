import { cpSync } from 'fs'
import { defineConfig } from 'tsup'

export default defineConfig({
  // 1. Mudamos o entry para ser um glob (mapeamento automático)
  // Isso vai gerar dist/components/ui/button.js, dist/components/ui/card.js, etc.
  entry: [
    'src/components/ui/**/*.tsx', // Pega todos os componentes atômicos (Shadcn)
    'src/components/index.ts', // Mantém o barrel file para quem quiser usar
    'src/hooks/index.ts',
    'src/lib/index.ts',
    'src/layouts/index.ts',
    'src/providers/index.ts',
    'src/pages/index.ts',
    'src/assets/index.ts',
    'src/styles/globals.css',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  minify: false,

  // Mantemos o banner agressivo para os chunks não quebrarem o Next
  banner: {
    js: '"use client";',
  },
  onSuccess: async () => {
    cpSync('src/assets', 'dist/ui', { recursive: true })
  },

  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.banner = {
      js: '"use client";',
    }
    return options
  },

  external: [
    'react',
    'react-dom',
    'lucide-react',
    'react-hook-form',
    '@radix-ui/*',
    '@timelapse/application',
    'nuqs',
  ],
  loader: {
    '.css': 'copy',
    '.png': 'copy',
    '.svg': 'copy',
    '.jpg': 'copy',
    '.jpeg': 'copy',
    '.gif': 'copy',
  },

  tsconfig: './tsconfig.build.json',
})
