import { useCallback, useState } from 'react'
import { toApiMessages } from '../utils/files'

function parseSseChunk(buffer, onEvent) {
  const blocks = buffer.split('\n\n')
  const remainder = blocks.pop() ?? ''

  for (const block of blocks) {
    if (!block.trim()) continue

    let eventType = 'message'
    let dataLine = ''

    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        dataLine = line.slice(6)
      }
    }

    if (!dataLine) continue

    try {
      onEvent(eventType, JSON.parse(dataLine))
    } catch {
      // ignore malformed chunks
    }
  }

  return remainder
}

async function streamChat(messages, handlers) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: toApiMessages(messages) }),
  })

  if (!response.ok) {
    let errorMessage = 'Request failed'
    try {
      const payload = await response.json()
      const raw = payload.error
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw)
          errorMessage = parsed.error?.message ?? raw
        } catch {
          errorMessage = raw
        }
      }
    } catch {
      errorMessage = await response.text()
    }
    throw new Error(errorMessage)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    buffer = parseSseChunk(buffer, (eventType, data) => {
      if (eventType === 'text') handlers.onDelta(data.delta)
      if (eventType === 'file') handlers.onFile(data)
      if (eventType === 'status') handlers.onStatus?.(data.message)
      if (eventType === 'error') throw new Error(data.message)
    })
  }

  if (buffer.trim()) {
    parseSseChunk(`${buffer}\n\n`, (eventType, data) => {
      if (eventType === 'text') handlers.onDelta(data.delta)
      if (eventType === 'file') handlers.onFile(data)
      if (eventType === 'status') handlers.onStatus?.(data.message)
      if (eventType === 'error') throw new Error(data.message)
    })
  }
}

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  const sendMessage = useCallback(
    async (text, attachments = []) => {
      const trimmed = text.trim()
      if (!trimmed && attachments.length === 0) return

      setError(null)
      setStatus(null)

      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        attachments,
      }

      const assistantId = crypto.randomUUID()
      const nextMessages = [
        ...messages,
        userMessage,
        { id: assistantId, role: 'assistant', content: '', files: [] },
      ]

      setMessages(nextMessages)
      setIsLoading(true)

      try {
        const history = nextMessages.slice(0, -1)
        await streamChat(history, {
          onDelta: (delta) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + delta }
                  : message,
              ),
            )
          },
          onFile: (file) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, files: [...(message.files ?? []), file] }
                  : message,
              ),
            )
          },
          onStatus: setStatus,
        })
      } catch (err) {
        setError(err.message)
        setMessages((current) => current.filter((message) => message.id !== assistantId))
      } finally {
        setIsLoading(false)
        setStatus(null)
      }
    },
    [messages],
  )

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
    setStatus(null)
  }, [])

  return { messages, isLoading, status, error, sendMessage, clearChat }
}
