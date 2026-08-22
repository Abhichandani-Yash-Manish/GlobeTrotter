import Link from 'next/link';
import { MapPinOff } from 'lucide-react';
import { Brand } from '@/components/brand';

export default function NotFound() {
  return <main className="standalone-state"><Brand /><div className="empty-state"><MapPinOff size={38} /><div className="eyebrow">404 · ROUTE NOT FOUND</div><h1>This stop is off the map.</h1><p>The trip may be private, deleted, or the link may be incorrect.</p><Link className="button button-primary" href="/">Return home</Link></div></main>;
}
