import { useEffect, useRef } from 'react'
import type { LinksFunction, LoaderFunctionArgs } from 'react-router'
import { useLocation } from 'react-router'
import { Stack } from '~/components/ui'
import { getProduct } from '~/features/product'
import { buildPageMeta } from '~/libs/seo'
import { cn } from '~/libs/utils'
import { JobBoard } from '~/routes/resources.job-board'
import { getDocJson } from '~/services/document.server'
import markdownStyles from '~/styles/md.css?url'
import type * as Route from './+types.index'
import { MobileToc } from './components/mobile-toc'
import {
  TableOfContents,
  TableOfContentsItem,
  TableOfContentsTitle,
} from './components/toc'

export const meta = ({
  location,
  data,
}: {
  location: Location
  data: Route.LoaderData
}) => {
  if (!data) {
    return []
  }
  const { doc } = data
  return buildPageMeta({
    title: String(doc.attributes.title),
    pathname: location.pathname,
    productId: data.product.id,
  })
}

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: markdownStyles },
]

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const filename = params['*'] ?? 'index'
  const { product } = getProduct(request)
  const doc = await getDocJson(product.id, filename)
  if (!doc) {
    throw new Response('File not found', { status: 404 })
  }

  return { doc, product }
}

export default function Docs({ loaderData: { doc } }: Route.ComponentProps) {
  const { hash, pathname } = useLocation()
  const mainRef = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(
          decodeURIComponent(location.hash),
        )
        if (element) {
          element.scrollIntoView()
        }
      }, 100)
    } else {
      mainRef.current?.scrollTo(0, 0)
    }
  }, [hash, pathname])

  return (
    <div className="grid grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[auto_14rem]">
      <div
        ref={mainRef}
        className={cn(
          'md-prose prose order-2 overflow-auto scroll-smooth px-4 pb-32 pt-8 dark:prose-invert md:order-1 md:pt-2',
          'max-w-none',
        )}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{ __html: doc.html }}
      />

      <Stack className="order-1 gap-0 overflow-auto md:order-2 md:mr-2 md:gap-4">
        <JobBoard className="hidden md:block" />

        {doc.headings.length > 0 && (
          <>
            <TableOfContents>
              <TableOfContentsTitle>目次</TableOfContentsTitle>
              {doc.headings.map((heading, index) => (
                <TableOfContentsItem
                  key={`${heading.slug}-${index}`}
                  className={cn(heading.headingLevel === 'h3' && 'ml-4')}
                >
                  <a href={`#${heading.slug}`}>{heading.html}</a>
                </TableOfContentsItem>
              ))}
            </TableOfContents>

            <MobileToc headings={doc.headings} />
          </>
        )}
      </Stack>
    </div>
  )
}
