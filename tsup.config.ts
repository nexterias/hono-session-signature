import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts'],
  target: ['node18'],
  format: ['cjs', 'esm'],
  clean: true,
  dts: true,
  keepNames: true,
  minify: true,
})
