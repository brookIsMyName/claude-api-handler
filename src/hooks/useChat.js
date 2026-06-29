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

function handleSseEvent(eventType, data, handlers) {
  if (eventType === 'text') handlers.onDelta(data.delta)
  if (eventType === 'file') handlers.onFile(data)
  if (eventType === 'website') handlers.onWebsite(data)
  if (eventType === 'status') handlers.onStatus?.(data.message)
  if (eventType === 'error') throw new Error(data.message)
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
    buffer = parseSseChunk(buffer, (eventType, data) => handleSseEvent(eventType, data, handlers))
  }

  if (buffer.trim()) {
    parseSseChunk(`${buffer}\n\n`, (eventType, data) => handleSseEvent(eventType, data, handlers))
  }
}

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [activeWebsite, setActiveWebsite] = useState(null)

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
        { id: assistantId, role: 'assistant', content: '', files: [], websites: [] },
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
          onWebsite: (website) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, websites: [...(message.websites ?? []), website] }
                  : message,
              ),
            )
            setActiveWebsite(website)
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
    setActiveWebsite(null)
  }, [])

  return {
    messages,
    isLoading,
    status,
    error,
    activeWebsite,
    setActiveWebsite,
    sendMessage,
    clearChat,
  }
}
