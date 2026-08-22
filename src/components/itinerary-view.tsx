'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock3, List, MapPinned, MapPin, Pencil } from 'lucide-react';
import { BudgetVisualization } from '@/components/budget-visualization';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { RouteMap } from '@/components/route-map';
import { RouteRibbon } from '@/components/route-ribbon';
import { enumerateDates } from '@/lib/domain';
import { formatMoney } from '@/lib/format';
import type { RouteMapData, TripDetail } from '@/types/domain';

export function ItineraryView({ detail, mapData }: { detail: TripDetail; mapData: RouteMapData }) {
  const [view, setView] = useState<'list' | 'calendar' | 'map'>('list');
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
          <button type="button" aria-pressed={view === 'map'} className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}><MapPinned size={16} /> Map</button>
        </div>
        {view === 'list' ? (
          <div className="itinerary-stop-list">
            {detail.stops.map((stop) => (
              <article key={stop.id} className="itinerary-stop">
                <div className="itinerary-stop-heading"><span className="route-code">{String(stop.order + 1).padStart(2, '0')}</span><div><h2>{stop.city.name}</h2><p>{stop.startDate} → {stop.endDate} · arrive by {stop.arrivalMode}{stop.arrivalDurationMinutes ? ` · ${stop.arrivalDurationMinutes} min` : ''}</p></div></div>
                {stop.activities.length === 0 ? <p className="muted-copy">An open stop—no activities scheduled.</p> : (
                  <div className="timeline-list">
                    {stop.activities.map((scheduled) => (
                      <div key={scheduled.id} className="timeline-row"><div className="timeline-thumb"><ImageWithFallback src={scheduled.activity.imageUrl} alt={scheduled.activity.name} sizes="56px" /></div><span className="mono">{scheduled.startTime ?? 'FLEX'}</span><span><strong>{scheduled.activity.name}</strong><small>{scheduled.date} · {scheduled.activity.category} · {scheduled.duration}h</small></span><strong>{formatMoney(scheduled.cost)}</strong></div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : view === 'calendar' ? (
          <div className="calendar-grid">
            {days.map((day, index) => {
              const activities = detail.stops.flatMap((stop) => stop.activities.filter((activity) => activity.date === day));
              const stop = detail.stops.find((item) => day >= item.startDate && day <= item.endDate);
              const dayExpenses = detail.expenses.filter((expense) => expense.date === day);
              const dayTotal = activities.reduce((total, item) => total + item.cost, 0) + dayExpenses.reduce((total, item) => total + item.amount, 0);
              return (
                <details key={day} className={`calendar-day ${detail.budget.overBudgetDays.includes(day) ? 'calendar-day-over' : ''}`} open>
                  <summary><span>DAY {String(index + 1).padStart(2, '0')}</span><strong>{day.slice(5)}</strong></summary>
                  <p>{stop?.city.name ?? 'In transit'}</p>
                  {activities.map((activity) => <small key={activity.id}><Clock3 size={11} /> {activity.startTime ?? 'Flex'} · {activity.activity.name}</small>)}
                  {activities.length === 0 && <small>Open day</small>}
                  {dayExpenses.map((expense) => <small key={expense.id}>Cost · {expense.description || expense.category} · {formatMoney(expense.amount)}</small>)}
                  <div className="calendar-day-total"><span>Planned</span><strong>{formatMoney(dayTotal)}</strong></div>
                  {detail.access && detail.access !== 'VIEWER' && stop && <Link href={`/trips/${detail.trip.id}/edit`}><Pencil size={12} /> Edit this day</Link>}
                </details>
              );
            })}
          </div>
        ) : <RouteMap data={mapData} />}
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
      <div className="itinerary-budget-visual"><BudgetVisualization detail={detail} /></div>
    </div>
  );
}
