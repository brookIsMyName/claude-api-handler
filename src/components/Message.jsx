import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { downloadBase64File, fileIcon } from '../utils/download'

export default function Message({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-avatar">{isUser ? 'You' : 'C'}</div>
      <div className="message-body">
        {message.attachments?.length > 0 && (
          <div className="message-attachments">
            {message.attachments.map((file) => (
              <div key={file.name} className="attachment-chip">
                {file.type === 'image' && file.preview ? (
                  <img src={file.preview} alt={file.name} className="attachment-image" />
                ) : (
                  <span className="attachment-name">{file.name}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {message.files?.length > 0 && (
          <div className="output-files">
            {message.files.map((file) => (
              <button
                key={file.name}
                type="button"
                className="output-file"
                onClick={() => downloadBase64File(file)}
              >
                <span className="output-file-icon">{fileIcon(file.name)}</span>
                <span className="output-file-info">
                  <span className="output-file-name">{file.name}</span>
                  <span className="output-file-action">Click to download</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {isUser ? (
          message.content && <p className="message-text">{message.content}</p>
        ) : (
          <div className="message-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || (message.files?.length ? '' : '…')}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
