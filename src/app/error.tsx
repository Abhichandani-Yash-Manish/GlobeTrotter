'use client';

import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="standalone-state"><div className="empty-state"><div className="eyebrow">ROUTE INTERRUPTED</div><h1>The board could not update.</h1><p>Your saved data is still in the database. Retry the current route.</p><button className="button button-primary" type="button" onClick={reset}>Try again</button></div></main>;
}
