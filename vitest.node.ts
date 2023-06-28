import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: './test/node.setup.ts',
    environment: 'node',
    name: `Node.js ${process.version}`,
  },
})
