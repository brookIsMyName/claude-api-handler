import PptxGenJS from 'pptxgenjs'

export async function createPptx({ filename, title, slides }) {
  const pptx = new PptxGenJS()
  pptx.author = 'Claude Chat'
  pptx.title = title || filename.replace(/\.pptx$/i, '')

  if (title) {
    const titleSlide = pptx.addSlide()
    titleSlide.addText(title, {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1.5,
      fontSize: 36,
      bold: true,
      align: 'center',
      color: '1a1a1a',
    })
  }

  for (const slide of slides) {
    const s = pptx.addSlide()

    if (slide.title) {
      s.addText(slide.title, {
        x: 0.5,
        y: 0.4,
        w: 9,
        h: 0.8,
        fontSize: 28,
        bold: true,
        color: '1a1a1a',
      })
    }

    if (slide.bullets?.length) {
      const bulletText = slide.bullets.map((bullet) => ({
        text: bullet,
        options: { bullet: true, breakLine: true },
      }))
      s.addText(bulletText, {
        x: 0.5,
        y: 1.4,
        w: 9,
        h: 4.5,
        fontSize: 18,
        color: '333333',
        valign: 'top',
      })
    } else if (slide.content) {
      s.addText(slide.content, {
        x: 0.5,
        y: 1.4,
        w: 9,
        h: 4.5,
        fontSize: 18,
        color: '333333',
        valign: 'top',
      })
    }

    if (slide.notes) {
      s.addNotes(slide.notes)
    }
  }

  const buffer = await pptx.write({ outputType: 'nodebuffer' })
  const safeName = filename.toLowerCase().endsWith('.pptx') ? filename : `${filename}.pptx`

  return {
    name: safeName,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    data: Buffer.from(buffer).toString('base64'),
  }
}
