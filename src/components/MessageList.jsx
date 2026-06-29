import { useEffect, useRef } from 'react'
import Message from './Message'

export default function MessageList({ messages, isLoading, status, onPreviewWebsite }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, status])

  if (messages.length === 0) {
    return (
      <div className="message-list empty">
        <div className="welcome">
          <h2>Build something beautiful</h2>
          <p>
            Describe a website and I&apos;ll design and code it with sharp UX/UI — landing pages,
            portfolios, dashboards, and more. Live preview + downloadable ZIP.
          </p>
          <div className="welcome-examples">
            <span>&ldquo;Build a SaaS landing page for a note-taking app&rdquo;</span>
            <span>&ldquo;Create a dark-mode portfolio for a photographer&rdquo;</span>
            <span>&ldquo;Design a pricing page with 3 tiers&rdquo;</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <Message key={message.id} message={message} onPreviewWebsite={onPreviewWebsite} />
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
