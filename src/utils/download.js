export function downloadBase64File({ name, mimeType, data }) {
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  const blob = new Blob([bytes], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export function fileIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pptx' || ext === 'ppt') return '📊'
  if (ext === 'pdf') return '📄'
  if (ext === 'csv' || ext === 'xlsx') return '📈'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️'
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'go', 'rs'].includes(ext)) return '💻'
  return '📎'
}
