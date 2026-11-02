import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: { outDir: '../d', emptyOutDir: true },
  // dev only: in a git worktree node_modules is a symlink to the main checkout,
  // so fonts resolve outside the root — allow serving the real path too
  server: { fs: { allow: [__dirname, fs.realpathSync(path.resolve(__dirname, 'node_modules'))] } },
})
