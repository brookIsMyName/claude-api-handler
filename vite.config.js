import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createChatHandler } from './server/chatHandler.js'

function apiPlugin(apiKey, model) {
  const handler = createChatHandler(apiKey, model)

  return {
    name: 'anthropic-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/chat', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/chat', handler)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), apiPlugin(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL)],
  }
})
