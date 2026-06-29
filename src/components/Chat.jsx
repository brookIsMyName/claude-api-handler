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
    mode,
    setMode,
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
            <span className="brand-icon">{mode === 'debug' ? 'D' : 'W'}</span>
            <div>
              <h1>{mode === 'debug' ? 'Code Debug' : 'Web Studio'}</h1>
              <span className="model-badge">
                Opus 4.8 · {mode === 'debug' ? 'bug fixing' : 'UX/UI + debug'}
              </span>
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
            mode={mode}
            onPreviewWebsite={setActiveWebsite}
          />
          {error && <div className="chat-error">{error}</div>}
        </main>

        <footer className="chat-footer">
          <InputArea
            onSend={sendMessage}
            disabled={isLoading}
            mode={mode}
            onModeChange={setMode}
          />
        </footer>
      </div>

      {activeWebsite && (
        <WebsitePreview website={activeWebsite} onClose={() => setActiveWebsite(null)} />
      )}
    </div>
  )
}
