import Link from 'next/link';
import { Brand } from '@/components/brand';

export function MarketingHeader() {
  return (
    <header className="marketing-header">
      <div className="page-width header-row">
        <Brand />
        <nav aria-label="Primary navigation">
          <Link href="/explore">Explore</Link>
          <Link href="/login">Sign in</Link>
          <Link className="button button-small button-dark" href="/signup">
            Start planning
          </Link>
        </nav>
      </div>
    </header>
  );
}
