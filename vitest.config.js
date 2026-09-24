import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom', // Allows you to interact with document, window, etc.
    coverage: {
      provider: 'v8' // or 'istanbul'
    },
  },
})
