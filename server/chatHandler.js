import { executeTool, SYSTEM_PROMPT, TOOLS } from './tools.js'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MAX_TOOL_ITERATIONS = 8

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

function sendSse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

async function callAnthropic(apiKey, model, messages) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 16384,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText)
  }

  return response.json()
}

async function runAgentLoop(apiKey, model, messages, res) {
  const apiMessages = [...messages]

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    sendSse(res, 'status', {
      message: iteration === 0 ? 'Thinking…' : 'Creating file…',
    })

    const response = await callAnthropic(apiKey, model, apiMessages)
    const assistantContent = response.content ?? []

    apiMessages.push({ role: 'assistant', content: assistantContent })

    for (const block of assistantContent) {
      if (block.type === 'text' && block.text) {
        sendSse(res, 'text', { delta: block.text })
      }
    }

    if (response.stop_reason !== 'tool_use') {
      return
    }

    const toolResults = []

    for (const block of assistantContent) {
      if (block.type !== 'tool_use') continue

      const label =
        block.name === 'create_pptx'
          ? 'Building presentation…'
          : `Creating ${block.input?.filename ?? 'file'}…`
      sendSse(res, 'status', { message: label })

      const result = await executeTool(block.name, block.input)

      if (result.file) {
        sendSse(res, 'file', result.file)
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: result.content,
      })
    }

    apiMessages.push({ role: 'user', content: toolResults })
  }

  sendSse(res, 'text', {
    delta: '\n\n(I reached the maximum number of file operations for this turn.)',
  })
}

export function createChatHandler(apiKey, defaultModel = 'claude-haiku-4-5-20251001') {
  return async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.end('Method not allowed')
      return
    }

    if (!apiKey) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: 'ANTHROPIC_API_KEY is not set. Add your key to the .env file and restart the dev server.',
        }),
      )
      return
    }

    try {
      const body = await readRequestBody(req)
      const { messages, model } = JSON.parse(body)

      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      await runAgentLoop(apiKey, model || defaultModel, messages, res)
      sendSse(res, 'done', {})
      res.end()
    } catch (err) {
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: err.message }))
        return
      }

      sendSse(res, 'error', { message: err.message })
      sendSse(res, 'done', {})
      res.end()
    }
  }
}
