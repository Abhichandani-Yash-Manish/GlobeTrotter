'use client';

import { useState } from 'react';
import { CalendarDays, List, MapPin } from 'lucide-react';
import { RouteRibbon } from '@/components/route-ribbon';
import { enumerateDates } from '@/lib/domain';
import { formatMoney } from '@/lib/format';
import type { TripDetail } from '@/types/domain';

export function ItineraryView({ detail }: { detail: TripDetail }) {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const days = enumerateDates(detail.trip.startDate, detail.trip.endDate);

  return (
    <div className="itinerary-layout">
      <aside className="itinerary-route-card">
        <div className="panel-heading"><span>ROUTE</span><MapPin size={16} /></div>
        <RouteRibbon stops={detail.stops} health={detail.health} />
      </aside>
      <section className="itinerary-main">
        <div className="view-toggle" role="group" aria-label="Itinerary view">
          <button type="button" aria-pressed={view === 'list'} className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={16} /> List</button>
          <button type="button" aria-pressed={view === 'calendar'} className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}><CalendarDays size={16} /> Calendar</button>
        </div>
        {view === 'list' ? (
          <div className="itinerary-stop-list">
            {detail.stops.map((stop) => (
              <article key={stop.id} className="itinerary-stop">
                <div className="itinerary-stop-heading"><span className="route-code">{String(stop.order + 1).padStart(2, '0')}</span><div><h2>{stop.city.name}</h2><p>{stop.startDate} → {stop.endDate}</p></div></div>
                {stop.activities.length === 0 ? <p className="muted-copy">An open stop—no activities scheduled.</p> : (
                  <div className="timeline-list">
                    {stop.activities.map((scheduled) => (
                      <div key={scheduled.id} className="timeline-row"><span className="mono">{scheduled.startTime ?? 'FLEX'}</span><span><strong>{scheduled.activity.name}</strong><small>{scheduled.date} · {scheduled.activity.category} · {scheduled.duration}h</small></span><strong>{formatMoney(scheduled.cost)}</strong></div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="calendar-grid">
            {days.map((day, index) => {
              const activities = detail.stops.flatMap((stop) => stop.activities.filter((activity) => activity.date === day));
              const stop = detail.stops.find((item) => day >= item.startDate && day <= item.endDate);
              return (
                <article key={day} className="calendar-day">
                  <div><span>DAY {String(index + 1).padStart(2, '0')}</span><strong>{day.slice(5)}</strong></div>
                  <p>{stop?.city.name ?? 'In transit'}</p>
                  {activities.map((activity) => <small key={activity.id}>{activity.startTime ?? 'Flex'} · {activity.activity.name}</small>)}
                  {activities.length === 0 && <small>Open day</small>}
                </article>
              );
            })}
          </div>
        )}
      </section>
      <aside className="itinerary-budget-card">
        <div className="panel-heading"><span>COST BREAKDOWN</span><strong>USD</strong></div>
        <div className="big-number">{formatMoney(detail.budget.spent)}</div>
        <p>{detail.budget.remaining === null ? 'No budget ceiling set' : `${formatMoney(detail.budget.remaining)} remaining`}</p>
        <dl className="budget-breakdown">
          {Object.entries(detail.budget.byCategory).map(([category, amount]) => <div key={category}><dt>{category}</dt><dd>{formatMoney(amount)}</dd></div>)}
        </dl>
        <div className="average-ticket"><span>AVG / DAY</span><strong>{formatMoney(detail.budget.averagePerDay)}</strong></div>
      </aside>
    </div>
  );
}
