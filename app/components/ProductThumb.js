'use client'

import { useState } from 'react'
import Image from 'next/image'
import { canOptimizeImage } from '../lib/product-image'

/**
 * Product photo that fills a .pt box (3:4). Next/Image serves a resized WebP, so a 2 MB source
 * photo costs the shopper tens of KB. Falls back to a branded name tile when there is no photo
 * or it fails to load. Photos from hosts next/image is not configured for are shown as-is
 * instead of crashing the page.
 */
export default function ProductThumb({ src, name, color, sizes = '(max-width: 600px) 50vw, 280px', priority = false, alt }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className="pt-fallback" role="img" aria-label={name || 'Vibin Apparel'}>
        <span className="pt-fallback-name">{String(name || 'Vibin').split('—')[0].trim()}</span>
        {color ? <span className="pt-fallback-color">{color}</span> : null}
      </div>
    )
  }
  return (
    <Image
      src={src}
      alt={alt ?? name ?? ''}
      fill
      sizes={sizes}
      quality={70}
      priority={priority}
      unoptimized={!canOptimizeImage(src)}
      onError={() => setFailed(true)}
      style={{ objectFit: 'cover' }}
    />
  )
}
