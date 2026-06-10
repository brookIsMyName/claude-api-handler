const MIME_BY_EXTENSION = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.xml': 'application/xml',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.js': 'text/javascript',
  '.ts': 'text/typescript',
  '.py': 'text/x-python',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
}

function guessMimeType(filename, provided) {
  if (provided) return provided
  const dot = filename.lastIndexOf('.')
  if (dot === -1) return 'text/plain'
  return MIME_BY_EXTENSION[filename.slice(dot).toLowerCase()] ?? 'text/plain'
}

export function createTextFile({ filename, content, mime_type }) {
  return {
    name: filename,
    mimeType: guessMimeType(filename, mime_type),
    data: Buffer.from(content, 'utf-8').toString('base64'),
  }
}
