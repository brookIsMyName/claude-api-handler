import { useEffect, useRef } from 'react'
import Message from './Message'

export default function MessageList({ messages, isLoading, status }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, status])

  if (messages.length === 0) {
    return (
      <div className="message-list empty">
        <div className="welcome">
          <h2>What can I help you with?</h2>
          <p>Ask anything, upload files, or say &ldquo;make me a pptx about…&rdquo; to get a downloadable presentation.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      {isLoading && status && (
        <div className="status-indicator">
          <span className="status-dot" />
          {status}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
