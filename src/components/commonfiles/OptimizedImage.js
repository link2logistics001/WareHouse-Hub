'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * OptimizedImage — drop-in replacement for raw <img> tags.
 *
 * Uses next/image under the hood for:
 *  • Automatic WebP / AVIF conversion
 *  • Responsive srcsets (serves right size for viewport)
 *  • Eager loading by default for instant display
 *
 * Props:
 *  src       — image URL (Firebase or any external)
 *  alt       — alt text
 *  fill      — true to fill parent container (object-fit: cover)
 *  width/height — explicit dimensions (when fill=false)
 *  className — extra classes for the wrapper
 *  imgClassName — extra classes for the <Image> itself
 *  sizes     — responsive sizes hint (default: 100vw)
 *  priority  — set true for above-the-fold hero images
 *  quality   — compression level (default 75)
 *  fallback  — fallback src when image fails to load
 */
const PLACEHOLDER_SRC =
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';

export default function OptimizedImage({
  src,
  alt = '',
  fill = true,
  width,
  height,
  className = '',
  imgClassName = '',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  quality = 75,
  fallback = PLACEHOLDER_SRC,
}) {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallback);
    }
  };

  const wrapperClass = `relative overflow-hidden ${className}`;

  const isFirebaseURL = typeof imgSrc === 'string' && imgSrc.includes('firebasestorage.googleapis.com');

  const imageProps = {
    src: imgSrc,
    alt,
    quality,
    sizes,
    priority,
    loading: priority ? undefined : 'eager',
    onError: handleError,
    className: imgClassName,
    style: fill ? { objectFit: 'cover' } : undefined,
    unoptimized: isFirebaseURL, // Fixes "upstream image response failed 404" in terminal for missing Firebase images
  };

  return (
    <div className={wrapperClass}>
      {fill ? (
        <Image {...imageProps} fill />
      ) : (
        <Image {...imageProps} width={width} height={height} />
      )}
    </div>
  );
}
