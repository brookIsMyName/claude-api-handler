import { createPptx } from './fileGenerators/pptx.js'
import { createTextFile } from './fileGenerators/textFile.js'

export const SYSTEM_PROMPT = `You are a helpful AI assistant in a chat app that can create downloadable files for the user.

When the user asks for a presentation, slides, PowerPoint, deck, or .pptx file, you MUST use the create_pptx tool to generate it. Do not only describe slides in text — always deliver the actual file.

When the user asks for any other downloadable file (document, spreadsheet data, code file, etc.), use the create_file tool.

After creating files, briefly confirm what you made and mention they can download it below. Keep your text response concise when you've already delivered the file.`

export const TOOLS = [
  {
    name: 'create_pptx',
    description:
      'Create a PowerPoint presentation (.pptx) for the user to download. Use whenever the user wants slides, a presentation, deck, or pptx.',
    input_schema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Filename for the presentation, e.g. "quarterly-report.pptx"',
        },
        title: {
          type: 'string',
          description: 'Optional title slide text',
        },
        slides: {
          type: 'array',
          description: 'Slides in presentation order',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Slide title' },
              bullets: {
                type: 'array',
                items: { type: 'string' },
                description: 'Bullet points for the slide',
              },
              content: {
                type: 'string',
                description: 'Paragraph content if not using bullets',
              },
              notes: { type: 'string', description: 'Speaker notes' },
            },
            required: ['title'],
          },
        },
      },
      required: ['filename', 'slides'],
    },
  },
  {
    name: 'create_file',
    description:
      'Create a downloadable text-based file (txt, md, csv, json, html, code, etc.) for the user.',
    input_schema: {
      type: 'object',
      properties: {
        filename: { type: 'string', description: 'Filename including extension' },
        content: { type: 'string', description: 'Full file contents' },
        mime_type: { type: 'string', description: 'Optional MIME type' },
      },
      required: ['filename', 'content'],
    },
  },
]

export async function executeTool(name, input) {
  try {
    if (name === 'create_pptx') {
      const file = await createPptx(input)
      return {
        content: `Successfully created "${file.name}" with ${input.slides?.length ?? 0} content slide(s). The user can download it now.`,
        file,
      }
    }

    if (name === 'create_file') {
      const file = createTextFile(input)
      return {
        content: `Successfully created "${file.name}". The user can download it now.`,
        file,
      }
    }

    return { content: `Unknown tool: ${name}` }
  } catch (err) {
    return { content: `Error creating file: ${err.message}` }
  }
}
