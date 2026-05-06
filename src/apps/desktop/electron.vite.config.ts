import image from '@rollup/plugin-image'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { readdirSync } from 'fs'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const uiSubpaths = readdirSync(resolve(__dirname, '../../packages/ui/src'), {
  withFileTypes: true,
})
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => `@metric-org/ui/${dirent.name}`)

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
      viteStaticCopy({
        targets: [
          {
            src: ['src/main/assets/timer-icon.png'],
            dest: 'assets',
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        '@metric-org/IoC': resolve(__dirname, '../../packages/IoC.ts'),
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      rollupOptions: {
        input: 'src/main/index.ts',
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      rollupOptions: {
        input: 'src/preload/index.ts',
      },
    },
  },
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
      dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    },
    optimizeDeps: {
      exclude: ['@metric-org/ui', ...uiSubpaths],
    },
    plugins: [react(), tailwindcss(), image()],
    build: {
      sourcemap: true,
      rollupOptions: {
        input: resolve(__dirname, 'src/renderer/index.html'),
      },
    },
  },
})
