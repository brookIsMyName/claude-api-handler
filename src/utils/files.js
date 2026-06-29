const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

const TEXT_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.markdown',
  '.json',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.vue',
  '.svelte',
  '.astro',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.html',
  '.htm',
  '.py',
  '.pyw',
  '.java',
  '.c',
  '.cpp',
  '.cc',
  '.cxx',
  '.h',
  '.hpp',
  '.hh',
  '.cs',
  '.fs',
  '.vb',
  '.xml',
  '.yaml',
  '.yml',
  '.csv',
  '.log',
  '.sh',
  '.bash',
  '.zsh',
  '.bat',
  '.cmd',
  '.ps1',
  '.sql',
  '.env',
  '.toml',
  '.ini',
  '.cfg',
  '.conf',
  '.properties',
  '.rs',
  '.go',
  '.rb',
  '.php',
  '.swift',
  '.kt',
  '.kts',
  '.dart',
  '.lua',
  '.r',
  '.pl',
  '.pm',
  '.ex',
  '.exs',
  '.erl',
  '.groovy',
  '.gradle',
  '.tf',
  '.tfvars',
  '.proto',
  '.graphql',
  '.gql',
  '.prisma',
  '.dockerfile',
  '.gitignore',
  '.npmrc',
  '.editorconfig',
  '.prettierrc',
  '.eslintrc',
  '.lock',
])

const CODE_MIME_TYPES = new Set([
  'application/javascript',
  'application/x-javascript',
  'text/javascript',
  'application/json',
  'application/xml',
  'text/xml',
  'application/typescript',
  'text/typescript',
  'application/x-sh',
  'application/sql',
  'application/x-yaml',
  'text/yaml',
  'text/x-python',
  'text/x-java-source',
  'text/x-c',
  'text/x-c++',
  'text/x-go',
  'text/x-rust',
  'text/x-ruby',
  'text/x-php',
  'text/x-shellscript',
])

const KNOWN_CODE_FILENAMES = new Set([
  'dockerfile',
  'makefile',
  'gemfile',
  'rakefile',
  'procfile',
  'vagrantfile',
  'brewfile',
  'podfile',
  'cmakelists.txt',
  'readme',
  'license',
])

const MAX_FILE_SIZE = 20 * 1024 * 1024

function getExtension(filename) {
  const dot = filename.lastIndexOf('.')
  return dot === -1 ? '' : filename.slice(dot).toLowerCase()
}

function getLanguageTag(filename) {
  const ext = getExtension(filename)
  const map = {
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.py': 'python',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.json': 'json',
    '.sql': 'sql',
    '.sh': 'bash',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.vue': 'vue',
    '.svelte': 'svelte',
  }
  return map[ext] ?? (ext.slice(1) || 'text')
}

function isKnownCodeFilename(filename) {
  const base = filename.split(/[/\\]/).pop()?.toLowerCase() ?? ''
  return KNOWN_CODE_FILENAMES.has(base) || base.startsWith('.')
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function looksLikeTextFile(file) {
  const slice = file.slice(0, 8192)
  const buffer = await slice.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  for (const byte of bytes) {
    if (byte === 0) return false
  }

  return bytes.length > 0
}

export function isCodeAttachment(attachment) {
  if (attachment.type !== 'text') return false
  const ext = getExtension(attachment.name)
  return TEXT_EXTENSIONS.has(ext) || isKnownCodeFilename(attachment.name)
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

  const isText =
    TEXT_EXTENSIONS.has(ext) ||
    isKnownCodeFilename(file.name) ||
    CODE_MIME_TYPES.has(file.type) ||
    file.type.startsWith('text/') ||
    (await looksLikeTextFile(file))

  if (isText) {
    const content = await file.text()
    return {
      type: 'text',
      name: file.name,
      content,
      isCode: TEXT_EXTENSIONS.has(ext) || isKnownCodeFilename(file.name) || CODE_MIME_TYPES.has(file.type),
    }
  }

  throw new Error(
    `${file.name}: unsupported file type. Upload code, images, PDFs, or text files.`,
  )
}

export function buildApiContent(text, attachments) {
  const blocks = []
  let combinedText = text.trim()

  for (const attachment of attachments) {
    if (attachment.type === 'text') {
      const lang = getLanguageTag(attachment.name)
      combinedText += `\n\n--- File: ${attachment.name} ---\n\`\`\`${lang}\n${attachment.content}\n\`\`\``
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
