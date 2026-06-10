import { useRef, useState } from 'react'
import { processFile } from '../utils/files'

export default function InputArea({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState([])
  const [fileError, setFileError] = useState(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const handleFiles = async (fileList) => {
    setFileError(null)
    const files = Array.from(fileList)

    try {
      const processed = await Promise.all(files.map(processFile))
      setAttachments((current) => [...current, ...processed])
    } catch (err) {
      setFileError(err.message)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index) => {
    setAttachments((current) => {
      const next = [...current]
      const removed = next.splice(index, 1)[0]
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return next
    })
  }

  const handleSubmit = () => {
    if (disabled || (!text.trim() && attachments.length === 0)) return
    onSend(text, attachments)
    setText('')
    setAttachments([])
    setFileError(null)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="input-area">
      {fileError && <p className="input-error">{fileError}</p>}

      {attachments.length > 0 && (
        <div className="pending-attachments">
          {attachments.map((file, index) => (
            <div key={`${file.name}-${index}`} className="pending-attachment">
              {file.type === 'image' && file.preview ? (
                <img src={file.preview} alt={file.name} />
              ) : (
                <span>{file.name}</span>
              )}
              <button
                type="button"
                className="remove-attachment"
                onClick={() => removeAttachment(index)}
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="input-row">
        <button
          type="button"
          className="attach-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach files"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept="image/*,.pdf,.txt,.md,.json,.js,.jsx,.ts,.tsx,.css,.html,.py,.java,.c,.cpp,.xml,.yaml,.yml,.csv,.sql,.sh,.env,.toml,.rs,.go,.rb,.php"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder="Message Claude…"
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        <button
          type="button"
          className="send-button"
          onClick={handleSubmit}
          disabled={disabled || (!text.trim() && attachments.length === 0)}
          title="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.4 20.4l17.45-7.6c.81-.35.81-1.49 0-1.84L3.4 3.36c-.74-.32-1.53.45-1.25 1.19L4.5 12l-2.35 7.25c-.28.74.51 1.51 1.25 1.19z" />
          </svg>
        </button>
      </div>

      <p className="input-hint">Enter to send · Shift+Enter for new line</p>
    </div>
  )
}
