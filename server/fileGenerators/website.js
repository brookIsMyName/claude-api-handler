import JSZip from 'jszip'

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'website'
}

export async function createWebsite({ project_name, files, entry = 'index.html' }) {
  if (!files?.length) {
    throw new Error('Website must include at least one file')
  }

  const safeName = sanitizeName(project_name)
  const zip = new JSZip()
  const folder = zip.folder(safeName) ?? zip

  for (const file of files) {
    const path = file.path.replace(/^\/+/, '')
    folder.file(path, file.content)
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer' })
  const normalizedFiles = files.map((file) => ({
    path: file.path.replace(/^\/+/, ''),
    content: file.content,
  }))

  return {
    projectName: project_name,
    name: `${safeName}.zip`,
    mimeType: 'application/zip',
    data: Buffer.from(buffer).toString('base64'),
    files: normalizedFiles,
    entry: entry.replace(/^\/+/, ''),
  }
}
