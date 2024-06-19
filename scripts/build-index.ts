import glob from 'fast-glob'
import fs from 'node:fs/promises'
import path from 'node:path'
import * as pagefind from 'pagefind'
import { getDoc } from '~/services/document.server'

const buildIndex = async () => {
  const { index } = await pagefind.createIndex({})
  if (!index) throw new Error('index is not created')

  const docs = await glob('docs/**/*.md')
  for (const filename of docs) {
    const pathname = filename.replace(/^docs\//, '').replace(/\.md$/, '')
    const doc = await getDoc(pathname)
    if (!doc) continue

    const htmlFilename = path.join('public/docs', `${pathname}.json`)
    const htmlDirname = path.dirname(htmlFilename)
    await fs.mkdir(htmlDirname, { recursive: true })
    await fs.writeFile(htmlFilename, JSON.stringify(doc, null, 2), {
      encoding: 'utf-8',
    })

    if (!doc.attributes.hidden) {
      await index.addCustomRecord({
        content: doc.html,
        meta: { title: doc.attributes.title.toString() },
        language: 'ja',
        url: pathname,
      })
    }
  }

  await index.writeFiles({ outputPath: 'public/pagefind' })
}

await buildIndex()
