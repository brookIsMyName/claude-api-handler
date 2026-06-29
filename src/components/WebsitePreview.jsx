import { useEffect, useMemo, useState } from 'react'
import { buildPreviewDocument, openPreviewInTab } from '../utils/websitePreview'
import { downloadBase64File } from '../utils/download'

export default function WebsitePreview({ website, onClose }) {
  const [key, setKey] = useState(0)
  const previewHtml = useMemo(() => buildPreviewDocument(website), [website, key])

  useEffect(() => {
    setKey((current) => current + 1)
  }, [website])

  if (!website) return null

  const zipFile = {
    name: website.name,
    mimeType: website.mimeType ?? 'application/zip',
    data: website.data,
  }

  return (
    <aside className="preview-panel">
      <div className="preview-toolbar">
        <div className="preview-title">
          <span className="preview-icon">🌐</span>
          <div>
            <strong>{website.projectName}</strong>
            <span>{website.files?.length ?? 0} files</span>
          </div>
        </div>
        <div className="preview-actions">
          <button type="button" onClick={() => setKey((k) => k + 1)} title="Refresh preview">
            ↻
          </button>
          <button type="button" onClick={() => openPreviewInTab(website)} title="Open in new tab">
            ↗
          </button>
          <button type="button" onClick={() => downloadBase64File(zipFile)} title="Download ZIP">
            ⬇
          </button>
          <button type="button" className="preview-close" onClick={onClose} title="Close preview">
            ×
          </button>
        </div>
      </div>
      <iframe
        key={key}
        className="preview-frame"
        title={`Preview: ${website.projectName}`}
        srcDoc={previewHtml}
        sandbox="allow-scripts allow-same-origin"
      />
    </aside>
  )
}
