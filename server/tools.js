export const SYSTEM_PROMPT = `You are an elite web designer and front-end engineer. Your specialty is building beautiful, production-quality websites with exceptional UX and UI design.

## Your core mission
When the user wants a website, landing page, portfolio, dashboard, component, or any web UI — you BUILD it using the create_website tool. Never just describe a design in text when they want something they can see and use.

## Design standards (always follow)
- **Visual polish**: refined typography, intentional whitespace, cohesive color palettes, subtle shadows, smooth border-radius, and micro-interactions
- **UX excellence**: clear visual hierarchy, obvious CTAs, scannable layouts, accessible contrast (WCAG AA), logical flow, and mobile-first responsive design
- **Modern aesthetics**: draw from current best-in-class product design — clean, confident, not generic or template-y
- **Craft details**: hover states, focus styles, transitions (150–300ms), loading states where relevant, and thoughtful empty states
- **Real content**: write compelling copy that fits the brief — avoid lorem ipsum unless the user asks for placeholder text

## Technical standards
- Semantic HTML5, modern CSS (custom properties, flexbox/grid, clamp() for fluid type)
- Vanilla HTML/CSS/JS unless the user requests a framework
- Separate files: at minimum index.html, styles.css, and script.js (add more as needed)
- Self-contained — no external CDN dependencies unless essential (Google Fonts is OK)
- Fully responsive with breakpoints for mobile, tablet, and desktop
- Clean, commented code structure

## Tool usage
- **create_website** — for ANY website, landing page, web app UI, or multi-file web project. Include ALL files in one call.
- **create_pptx** — for presentations only
- **create_file** — for single standalone files (not full websites)

## Iteration
When the user asks to revise a website, call create_website again with the complete updated project (all files), incorporating their feedback.

After delivering a website, briefly highlight key design decisions. Keep text concise when the preview speaks for itself.`

export const TOOLS = [
  {
    name: 'create_website',
    description:
      'Build a complete, multi-file website with exceptional UX/UI design. Use for landing pages, portfolios, dashboards, marketing sites, or any web UI. Always include index.html plus CSS and JS files.',
    input_schema: {
      type: 'object',
      properties: {
        project_name: {
          type: 'string',
          description: 'Short project name, e.g. "aurora-landing" or "portfolio"',
        },
        entry: {
          type: 'string',
          description: 'Main HTML entry file path, default index.html',
        },
        files: {
          type: 'array',
          description: 'All website files with paths and full contents',
          items: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Relative path, e.g. index.html, css/styles.css, js/main.js',
              },
              content: { type: 'string', description: 'Complete file contents' },
            },
            required: ['path', 'content'],
          },
        },
      },
      required: ['project_name', 'files'],
    },
  },
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
      'Create a single downloadable text-based file (txt, md, csv, json, etc.). Do NOT use this for full websites — use create_website instead.',
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

function toolStatusLabel(name, input) {
  if (name === 'create_website') return `Building ${input?.project_name ?? 'website'}…`
  if (name === 'create_pptx') return 'Building presentation…'
  if (name === 'create_file') return `Creating ${input?.filename ?? 'file'}…`
  return 'Working…'
}

export { toolStatusLabel }

export async function executeTool(name, input) {
  try {
    if (name === 'create_website') {
      const { createWebsite } = await import('./fileGenerators/website.js')
      const website = await createWebsite(input)
      const fileCount = input.files?.length ?? 0
      return {
        content: `Successfully built "${website.projectName}" with ${fileCount} file(s). The user can preview it live and download the ZIP.`,
        website,
      }
    }

    if (name === 'create_pptx') {
      const { createPptx } = await import('./fileGenerators/pptx.js')
      const file = await createPptx(input)
      return {
        content: `Successfully created "${file.name}" with ${input.slides?.length ?? 0} content slide(s). The user can download it now.`,
        file,
      }
    }

    if (name === 'create_file') {
      const { createTextFile } = await import('./fileGenerators/textFile.js')
      const file = createTextFile(input)
      return {
        content: `Successfully created "${file.name}". The user can download it now.`,
        file,
      }
    }

    return { content: `Unknown tool: ${name}` }
  } catch (err) {
    return { content: `Error: ${err.message}` }
  }
}
