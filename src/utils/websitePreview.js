function resolvePath(href, entryPath) {
  const clean = href.replace(/^\.\//, '').split('?')[0].split('#')[0]
  if (!clean) return clean

  const entryDir = entryPath.includes('/')
    ? entryPath.slice(0, entryPath.lastIndexOf('/') + 1)
    : ''

  if (clean.startsWith('/')) return clean.slice(1)

  const parts = [...entryDir.split('/').filter(Boolean), ...clean.split('/')]
  const resolved = []

  for (const part of parts) {
    if (part === '..') resolved.pop()
    else if (part !== '.' && part !== '') resolved.push(part)
  }

  return resolved.join('/')
}

export function buildPreviewDocument(website) {
  const entry = website.entry || 'index.html'
  const fileMap = new Map(
    (website.files ?? []).map((file) => [file.path.replace(/^\.\//, ''), file.content]),
  )

  let html = fileMap.get(entry) ?? fileMap.get('index.html')
  if (!html) {
    return '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;color:#666"><p>No index.html found in project.</p></body></html>'
  }

  html = html.replace(
    /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi,
    (match, href) => {
      const path = resolvePath(href, entry)
      const css = fileMap.get(path)
      return css ? `<style>\n${css}\n</style>` : match
    },
  )

  html = html.replace(
    /<script\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (match, src) => {
      const path = resolvePath(src, entry)
      const js = fileMap.get(path)
      return js ? `<script>\n${js}\n</script>` : match
    },
  )

  return html
}

export function openPreviewInTab(website) {
  const html = buildPreviewDocument(website)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
