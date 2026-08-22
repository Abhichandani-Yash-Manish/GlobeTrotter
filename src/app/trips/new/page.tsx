import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { TripForm } from '@/components/trip-form';

export const metadata: Metadata = { title: 'Plan a trip' };

export default function NewTripPage() {
  return <AppShell><div className="page-width content-page narrow-page"><header className="page-heading"><div className="eyebrow">NEW DEPARTURE</div><h1>Issue a new itinerary.</h1><p>Set the boundaries first. The planner will keep every stop, activity, and cost inside them.</p></header><TripForm /></div></AppShell>;
}
