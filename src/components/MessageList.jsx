import { useEffect, useRef } from 'react'
import Message from './Message'

export default function MessageList({ messages, isLoading, status, mode, onPreviewWebsite }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, status])

  if (messages.length === 0) {
    return (
      <div className="message-list empty">
        <div className="welcome">
          {mode === 'debug' ? (
            <>
              <h2>Debug your code</h2>
              <p>
                Paste code, attach files, or describe the error. I&apos;ll find the bug, explain
                it, and give you fixed files to download.
              </p>
              <div className="welcome-examples">
                <span>Attach your .js / .py / .ts file and hit send</span>
                <span>&ldquo;Why does this React component re-render infinitely?&rdquo;</span>
                <span>&ldquo;Fix the TypeError in my attached script&rdquo;</span>
              </div>
            </>
          ) : (
            <>
              <h2>Build something beautiful</h2>
              <p>
                Describe a website and I&apos;ll design and code it with sharp UX/UI — landing pages,
                portfolios, dashboards, and more. Live preview + downloadable ZIP.
              </p>
              <div className="welcome-examples">
                <span>&ldquo;Build a SaaS landing page for a note-taking app&rdquo;</span>
                <span>&ldquo;Create a dark-mode portfolio for a photographer&rdquo;</span>
                <span>Switch to <strong>Debug</strong> to fix code issues</span>
              </div>
            </>
          )}
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
