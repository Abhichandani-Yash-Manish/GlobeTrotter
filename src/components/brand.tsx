import Link from 'next/link';

export function Brand({ href = '/' }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="GlobeTrotter home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>
        Globe<span>Trotter</span>
      </span>
    </Link>
  );
}
