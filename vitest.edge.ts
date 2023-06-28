import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'EdgeRuntime',
    environment: 'edge-runtime',
  },
})
