import { useRef, useState } from 'react'
import { isCodeAttachment, processFile } from '../utils/files'

export default function InputArea({ onSend, disabled, mode, onModeChange }) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState([])
  const [fileError, setFileError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const handleFiles = async (fileList) => {
    if (!fileList?.length) return

    setFileError(null)
    const files = Array.from(fileList)
    const results = await Promise.allSettled(files.map(processFile))
    const processed = []
    const errors = []

    for (const result of results) {
      if (result.status === 'fulfilled') {
        processed.push(result.value)
      } else {
        errors.push(result.reason?.message ?? 'Failed to read file')
      }
    }

    if (processed.length) {
      setAttachments((current) => [...current, ...processed])
    }

    if (errors.length) {
      setFileError(errors.join(' · '))
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

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  const placeholder =
    mode === 'debug'
      ? 'Paste code or describe the bug… (attach .js, .py, .ts, etc.)'
      : 'Describe the website you want to build…'

  return (
    <div
      className={`input-area ${isDragging ? 'dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="mode-toggle">
        <button
          type="button"
          className={mode === 'build' ? 'active' : ''}
          onClick={() => onModeChange('build')}
          disabled={disabled}
        >
          Build
        </button>
        <button
          type="button"
          className={mode === 'debug' ? 'active' : ''}
          onClick={() => onModeChange('debug')}
          disabled={disabled}
        >
          Debug
        </button>
      </div>

      {fileError && <p className="input-error">{fileError}</p>}

      {attachments.length > 0 && (
        <div className="pending-attachments">
          {attachments.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={`pending-attachment ${isCodeAttachment(file) ? 'code-file' : ''}`}
            >
              {file.type === 'image' && file.preview ? (
                <img src={file.preview} alt={file.name} />
              ) : (
                <span>
                  {isCodeAttachment(file) ? '💻 ' : ''}
                  {file.name}
                </span>
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
          title="Attach code or files"
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
          onChange={(event) => handleFiles(event.target.files)}
        />

        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder={placeholder}
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={(event) => {
            const items = event.clipboardData?.items
            if (!items) return

            const pastedFiles = []
            for (const item of items) {
              if (item.kind === 'file') {
                const file = item.getAsFile()
                if (file) pastedFiles.push(file)
              }
            }

            if (pastedFiles.length) {
              event.preventDefault()
              handleFiles(pastedFiles)
            }
          }}
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

      <p className="input-hint">
        {mode === 'debug'
          ? 'Attach or drop code files · paste code directly · Enter to send'
          : 'Enter to send · Shift+Enter for new line'}
      </p>
    </div>
  )
}
