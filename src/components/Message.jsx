import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { isCodeAttachment } from '../utils/files'
import { downloadBase64File, fileIcon } from '../utils/download'

export default function Message({ message, onPreviewWebsite }) {
  const isUser = message.role === 'user'
  const hasOutput =
    (message.files?.length ?? 0) > 0 ||
    (message.websites?.length ?? 0) > 0

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-avatar">{isUser ? 'You' : 'W'}</div>
      <div className="message-body">
        {message.attachments?.length > 0 && (
          <div className="message-attachments">
            {message.attachments.map((file) => (
              <div key={file.name} className="attachment-chip">
                {file.type === 'image' && file.preview ? (
                  <img src={file.preview} alt={file.name} className="attachment-image" />
                ) : (
                  <span className="attachment-name">
                    {isCodeAttachment(file) ? '💻 ' : ''}
                    {file.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {message.websites?.length > 0 && (
          <div className="output-files">
            {message.websites.map((website) => (
              <div key={website.name} className="website-card">
                <div className="website-card-header">
                  <span className="output-file-icon">🌐</span>
                  <div className="output-file-info">
                    <span className="output-file-name">{website.projectName}</span>
                    <span className="output-file-action">
                      {website.files?.length ?? 0} files · ready to preview
                    </span>
                  </div>
                </div>
                <div className="website-card-actions">
                  <button type="button" className="website-btn primary" onClick={() => onPreviewWebsite?.(website)}>
                    Preview
                  </button>
                  <button
                    type="button"
                    className="website-btn"
                    onClick={() =>
                      downloadBase64File({
                        name: website.name,
                        mimeType: website.mimeType ?? 'application/zip',
                        data: website.data,
                      })
                    }
                  >
                    Download ZIP
                  </button>
                </div>
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
                  <span className="output-file-action">
                    {file.name.match(/\.(js|ts|jsx|tsx|py|java|go|rs|rb|php|cs|cpp|c|html|css)$/i)
                      ? 'Fixed code · click to download'
                      : 'Click to download'}
                  </span>
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
              {message.content || (hasOutput ? '' : '…')}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
