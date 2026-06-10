const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

const TEXT_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.json',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.css',
  '.html',
  '.py',
  '.java',
  '.c',
  '.cpp',
  '.h',
  '.xml',
  '.yaml',
  '.yml',
  '.csv',
  '.log',
  '.sh',
  '.bat',
  '.sql',
  '.env',
  '.toml',
  '.rs',
  '.go',
  '.rb',
  '.php',
])

const MAX_FILE_SIZE = 20 * 1024 * 1024

function getExtension(filename) {
  const dot = filename.lastIndexOf('.')
  return dot === -1 ? '' : filename.slice(dot).toLowerCase()
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function processFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${file.name} is too large (max 20 MB)`)
  }

  const ext = getExtension(file.name)

  if (IMAGE_TYPES.has(file.type)) {
    const data = await fileToBase64(file)
    return {
      type: 'image',
      name: file.name,
      mediaType: file.type,
      data,
      preview: URL.createObjectURL(file),
    }
  }

  if (file.type === 'application/pdf' || ext === '.pdf') {
    const data = await fileToBase64(file)
    return {
      type: 'document',
      name: file.name,
      mediaType: 'application/pdf',
      data,
    }
  }

  if (TEXT_EXTENSIONS.has(ext) || file.type.startsWith('text/')) {
    const content = await file.text()
    return {
      type: 'text',
      name: file.name,
      content,
    }
  }

  throw new Error(`${file.name}: unsupported file type. Upload images, PDFs, or text/code files.`)
}

export function buildApiContent(text, attachments) {
  const blocks = []
  let combinedText = text.trim()

  for (const attachment of attachments) {
    if (attachment.type === 'text') {
      combinedText += `\n\n--- File: ${attachment.name} ---\n${attachment.content}`
    }
  }

  if (combinedText) {
    blocks.push({ type: 'text', text: combinedText })
  }

  for (const attachment of attachments) {
    if (attachment.type === 'image') {
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: attachment.mediaType,
          data: attachment.data,
        },
      })
    } else if (attachment.type === 'document') {
      blocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: attachment.mediaType,
          data: attachment.data,
        },
      })
    }
  }

  if (blocks.length === 0) {
    return ''
  }

  if (blocks.length === 1 && blocks[0].type === 'text') {
    return blocks[0].text
  }

  return blocks
}

export function toApiMessages(messages) {
  return messages.map((message) => ({
    role: message.role,
    content:
      message.role === 'assistant'
        ? message.content
        : buildApiContent(message.content, message.attachments ?? []),
  }))
}
