import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Vitest's default glob matches *.spec.js anywhere, which would also
    // pick up e2e/*.spec.js — those use Playwright's test()/expect(),
    // not Vitest's, and error out. Scope unit tests to src/ only.
    include: ['src/**/*.test.{js,jsx}'],
  },
})
