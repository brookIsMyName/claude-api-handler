import { useChat } from '../hooks/useChat'
import InputArea from './InputArea'
import MessageList from './MessageList'

export default function Chat() {
  const { messages, isLoading, status, error, sendMessage, clearChat } = useChat()

  return (
    <div className="chat-app">
      <header className="chat-header">
        <div className="chat-brand">
          <span className="brand-icon">C</span>
          <div>
            <h1>Claude</h1>
            <span className="model-badge">Haiku 4.5</span>
          </div>
        </div>
        <button type="button" className="new-chat-button" onClick={clearChat} disabled={isLoading}>
          New chat
        </button>
      </header>

      <main className="chat-main">
        <MessageList messages={messages} isLoading={isLoading} status={status} />
        {error && <div className="chat-error">{error}</div>}
      </main>

      <footer className="chat-footer">
        <InputArea onSend={sendMessage} disabled={isLoading} />
      </footer>
    </div>
  )
}
