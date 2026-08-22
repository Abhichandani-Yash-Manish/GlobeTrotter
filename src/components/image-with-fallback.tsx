'use client';

import Image from 'next/image';
import { useState } from 'react';

export function ImageWithFallback({
  src,
  alt,
  sizes,
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="image-fallback" role="img" aria-label={`${alt} image unavailable`}>
        <span aria-hidden="true">GT</span>
      </div>
    );
  }

  return (
    <Image
      fill
      src={src}
      alt={alt}
      sizes={sizes}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      onError={() => setFailed(true)}
    />
  );
}
