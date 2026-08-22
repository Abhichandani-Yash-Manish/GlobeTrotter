import Link from 'next/link';

export function Brand({ href = '/' }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="GlobeTrotter home">
      <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
        <circle className="brand-globe" cx="24" cy="24" r="18" />
        <path className="brand-grid" d="M6 24h36M24 6c-6 5-9 11-9 18s3 13 9 18M24 6c6 5 9 11 9 18s-3 13-9 18" />
        <path className="brand-route" d="M8.5 31.5C14 16 25 12 38.5 15.5" />
        <circle className="brand-origin" cx="9" cy="31" r="2.5" />
        <path className="brand-pin" d="M39 10.5a5.5 5.5 0 0 0-5.5 5.5c0 4.2 5.5 9.5 5.5 9.5s5.5-5.3 5.5-9.5a5.5 5.5 0 0 0-5.5-5.5Z" />
        <circle className="brand-pin-core" cx="39" cy="16" r="1.8" />
      </svg>
      <span>
        Globe<span>Trotter</span>
      </span>
    </Link>
  );
}
