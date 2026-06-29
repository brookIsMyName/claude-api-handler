import { useChat } from '../hooks/useChat'
import InputArea from './InputArea'
import MessageList from './MessageList'
import WebsitePreview from './WebsitePreview'

export default function Chat() {
  const {
    messages,
    isLoading,
    status,
    error,
    activeWebsite,
    setActiveWebsite,
    sendMessage,
    clearChat,
  } = useChat()

  return (
    <div className={`app-shell ${activeWebsite ? 'with-preview' : ''}`}>
      <div className="chat-app">
        <header className="chat-header">
          <div className="chat-brand">
            <span className="brand-icon">W</span>
            <div>
              <h1>Web Studio</h1>
              <span className="model-badge">Opus 4.8 · UX/UI focused</span>
            </div>
          </div>
          <button type="button" className="new-chat-button" onClick={clearChat} disabled={isLoading}>
            New chat
          </button>
        </header>

        <main className="chat-main">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            status={status}
            onPreviewWebsite={setActiveWebsite}
          />
          {error && <div className="chat-error">{error}</div>}
        </main>

        <footer className="chat-footer">
          <InputArea onSend={sendMessage} disabled={isLoading} />
        </footer>
      </div>

      {activeWebsite && (
        <WebsitePreview website={activeWebsite} onClose={() => setActiveWebsite(null)} />
      )}
    </div>
  )
}
