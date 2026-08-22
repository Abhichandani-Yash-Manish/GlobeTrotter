'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Check,
  CircleAlert,
  Copy,
  DollarSign,
  GripVertical,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { RouteRibbon } from '@/components/route-ribbon';
import { StatusMessage } from '@/components/status-message';
import { requestJson } from '@/lib/client-api';
import { formatMoney } from '@/lib/format';
import type { ActivityDto, CityDto, PlannerStop, TripDetail } from '@/types/domain';

function SortableStop({
  stop,
  selected,
  onBrowse,
  onDelete,
  onDeleteActivity,
  busy,
}: {
  stop: PlannerStop;
  selected: boolean;
  onBrowse: () => void;
  onDelete: () => void;
  onDeleteActivity: (scheduledId: string, activityName: string) => void;
  busy: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`stop-card ${selected ? 'stop-card-selected' : ''} ${isDragging ? 'is-dragging' : ''}`}
    >
      <div className="stop-card-topline">
        <button className="drag-handle" type="button" aria-label={`Reorder ${stop.city.name}`} {...attributes} {...listeners}>
          <GripVertical size={19} />
        </button>
        <span className="route-code">{String(stop.order + 1).padStart(2, '0')}</span>
        <div>
          <h3>{stop.city.name}</h3>
          <p>{stop.city.country} · {stop.startDate} → {stop.endDate}</p>
        </div>
        <button className="icon-button danger" type="button" onClick={onDelete} disabled={busy} aria-label={`Remove ${stop.city.name}`}>
          <Trash2 size={17} />
        </button>
      </div>
      {stop.notes && <p className="stop-notes">“{stop.notes}”</p>}
      <div className="scheduled-list">
        {stop.activities.length === 0 ? (
          <p className="muted-copy">No activities yet. Keep the day open or add one from the city board.</p>
        ) : (
          stop.activities.map((scheduled) => (
            <div className="scheduled-row" key={scheduled.id}>
              <span className="mono">{scheduled.startTime ?? 'FLEX'}</span>
              <span><strong>{scheduled.activity.name}</strong><small>{scheduled.date} · {scheduled.duration}h</small></span>
              <span className="scheduled-actions">
                <span className="mono">{formatMoney(scheduled.cost)}</span>
                <button
                  className="icon-button danger scheduled-remove"
                  type="button"
                  onClick={() => onDeleteActivity(scheduled.id, scheduled.activity.name)}
                  disabled={busy}
                  aria-label={`Remove ${scheduled.activity.name} from ${stop.city.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </span>
            </div>
          ))
        )}
      </div>
      <button className="button button-ghost button-small" type="button" onClick={onBrowse}>
        <Plus size={16} /> {selected ? 'Activity board open' : 'Browse activities'}
      </button>
    </article>
  );
}

export function PlannerClient({
  initialDetail,
  initialCities,
}: {
  initialDetail: TripDetail;
  initialCities: CityDto[];
}) {
  const [detail, setDetail] = useState(initialDetail);
  const [cities, setCities] = useState(initialCities);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(initialDetail.stops[0]?.id ?? null);
  const [activities, setActivities] = useState<ActivityDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const selectedStop = detail.stops.find((stop) => stop.id === selectedStopId) ?? null;
  const budgetPercent = detail.budget.budget
    ? Math.min(100, (detail.budget.spent / detail.budget.budget) * 100)
    : 0;
  const urgentIssues = detail.health.filter((issue) => issue.severity !== 'info');

  function report(text: string, tone: 'success' | 'error' = 'success') {
    setMessage(text);
    setMessageTone(tone);
  }

  async function updateDetail(work: () => Promise<TripDetail>, successMessage: string) {
    setBusy(true);
    setMessage(null);
    try {
      const next = await work();
      setDetail(next);
      report(successMessage);
      return next;
    } catch (error) {
      report(error instanceof Error ? error.message : 'The route could not be updated.', 'error');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function searchCities(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get('q') ?? '');
    setBusy(true);
    try {
      setCities(await requestJson<CityDto[]>(`/api/cities?q=${encodeURIComponent(query)}`));
    } catch (error) {
      report(error instanceof Error ? error.message : 'Destination search failed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function addStop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const next = await updateDetail(
      () => requestJson<TripDetail>(`/api/trips/${detail.trip.id}/stops`, {
        method: 'POST',
        body: JSON.stringify({
          cityId: form.get('cityId'),
          startDate: form.get('startDate'),
          endDate: form.get('endDate'),
          notes: form.get('notes'),
        }),
      }),
      'Destination added to the route.',
    );
    if (next) {
      const added = next.stops.at(-1);
      if (added) setSelectedStopId(added.id);
      formElement.reset();
    }
  }

  async function deleteStop(stop: PlannerStop) {
    if (!window.confirm(`Remove ${stop.city.name} and its scheduled activities?`)) return;
    const next = await updateDetail(
      () => requestJson<TripDetail>(`/api/trips/${detail.trip.id}/stops/${stop.id}`, { method: 'DELETE' }),
      `${stop.city.name} removed.`,
    );
    if (next && selectedStopId === stop.id) setSelectedStopId(next.stops[0]?.id ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = detail.stops.findIndex((stop) => stop.id === active.id);
    const newIndex = detail.stops.findIndex((stop) => stop.id === over.id);
    const reordered = arrayMove(detail.stops, oldIndex, newIndex).map((stop, order) => ({ ...stop, order }));
    const previous = detail;
    setDetail({ ...detail, stops: reordered });
    setBusy(true);
    try {
      const next = await requestJson<TripDetail>(`/api/trips/${detail.trip.id}/stops/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds: reordered.map((stop) => stop.id) }),
      });
      setDetail(next);
      report('Route order saved.');
    } catch (error) {
      setDetail(previous);
      report(error instanceof Error ? error.message : 'Could not reorder the route.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function browseActivities(stop: PlannerStop) {
    setSelectedStopId(stop.id);
    setBusy(true);
    try {
      setActivities(await requestJson<ActivityDto[]>(`/api/cities/${stop.cityId}/activities`));
      setMessage(null);
    } catch (error) {
      report(error instanceof Error ? error.message : 'Could not load activities.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function addActivity(activity: ActivityDto, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStop) return;
    const form = new FormData(event.currentTarget);
    await updateDetail(
      () => requestJson<TripDetail>(`/api/trips/${detail.trip.id}/stops/${selectedStop.id}/activities`, {
        method: 'POST',
        body: JSON.stringify({
          activityId: activity.id,
          date: form.get('date'),
          startTime: form.get('startTime') || null,
          cost: activity.cost,
          duration: activity.duration,
        }),
      }),
      `${activity.name} scheduled in ${selectedStop.city.name}.`,
    );
  }

  async function deleteActivity(stop: PlannerStop, scheduledId: string, activityName: string) {
    if (!window.confirm(`Remove ${activityName} from ${stop.city.name}?`)) return;
    await updateDetail(
      () => requestJson<TripDetail>(
        `/api/trips/${detail.trip.id}/stops/${stop.id}/activities/${scheduledId}`,
        { method: 'DELETE' },
      ),
      `${activityName} removed from the schedule.`,
    );
  }

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const next = await updateDetail(
      () => requestJson<TripDetail>(`/api/trips/${detail.trip.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          tripStopId: form.get('tripStopId') || null,
          category: form.get('category'),
          amount: Number(form.get('amount')),
          description: form.get('description'),
          date: form.get('date'),
        }),
      }),
      'Cost added to the live budget.',
    );
    if (next) formElement.reset();
  }

  async function deleteExpense(expenseId: string, description: string | null) {
    const label = description || 'this cost';
    if (!window.confirm(`Remove ${label} from the budget?`)) return;
    await updateDetail(
      () => requestJson<TripDetail>(`/api/trips/${detail.trip.id}/expenses/${expenseId}`, { method: 'DELETE' }),
      `${description || 'Cost'} removed from the budget.`,
    );
  }

  async function publishTrip() {
    setBusy(true);
    try {
      const published = await requestJson<{ isPublic: boolean; sharePath: string | null }>(
        `/api/trips/${detail.trip.id}/publish`,
        { method: 'PUT', body: JSON.stringify({ published: !detail.trip.isPublic }) },
      );
      const next = await requestJson<TripDetail>(`/api/trips/${detail.trip.id}`);
      setDetail(next);
      report(published.isPublic ? 'Trip published. The share link is live.' : 'Trip returned to private mode.');
    } catch (error) {
      report(error instanceof Error ? error.message : 'Could not update publishing.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function copyShareLink() {
    if (!detail.trip.publicId) return;
    const url = `${window.location.origin}/share/${detail.trip.publicId}`;
    await navigator.clipboard.writeText(url);
    report('Share link copied.');
  }

  return (
    <div className="planner-page">
      <div className="planner-titlebar">
        <div>
          <div className="eyebrow">LIVE ITINERARY · {detail.trip.startDate} / {detail.trip.endDate}</div>
          <h1>{detail.trip.name}</h1>
          <p>{detail.trip.description || 'A blank field notebook, ready for its first route.'}</p>
        </div>
        <div className="title-actions">
          <Link className="button button-ghost" href={`/trips/${detail.trip.id}`}>Preview</Link>
          <button className="button button-dark" type="button" onClick={publishTrip} disabled={busy}>
            <Send size={17} /> {detail.trip.isPublic ? 'Make private' : 'Publish'}
          </button>
          {detail.trip.isPublic && (
            <button className="icon-button" type="button" onClick={copyShareLink} aria-label="Copy share link">
              <Copy size={17} />
            </button>
          )}
        </div>
      </div>

      <StatusMessage message={message} tone={messageTone} />
      <div className="planner-mobile-route"><RouteRibbon stops={detail.stops} health={detail.health} compact /></div>

      <div className="planner-grid">
        <aside className="planner-route-panel">
          <div className="panel-heading"><span>ROUTE BOARD</span><strong>{detail.stops.length}</strong></div>
          <RouteRibbon stops={detail.stops} health={detail.health} />
          <details className="add-stop-panel" open={detail.stops.length === 0}>
            <summary><Plus size={16} /> Add destination</summary>
            <form className="mini-search" onSubmit={searchCities}>
              <input name="q" aria-label="Search destinations" placeholder="Search city or country" />
              <button type="submit" aria-label="Search" disabled={busy}><Search size={16} /></button>
            </form>
            <form className="stack-form compact-form" onSubmit={addStop}>
              <label>Destination
                <select name="cityId" required defaultValue="">
                  <option value="" disabled>Choose from {cities.length} cities</option>
                  {cities.map((city) => <option key={city.id} value={city.id}>{city.name}, {city.country}</option>)}
                </select>
              </label>
              <label>Arrive<input name="startDate" type="date" min={detail.trip.startDate} max={detail.trip.endDate} required /></label>
              <label>Depart<input name="endDate" type="date" min={detail.trip.startDate} max={detail.trip.endDate} required /></label>
              <label>Notes<input name="notes" maxLength={500} placeholder="Train at 08:10, check-in after 3" /></label>
              <button className="button button-primary button-small" type="submit" disabled={busy}><Plus size={15} /> Add to route</button>
            </form>
          </details>
        </aside>

        <section className="planner-canvas" aria-label="Itinerary stops">
          <div className="canvas-heading">
            <div><span>STOP CANVAS</span><p>Drag the grip to change the route order.</p></div>
            {busy && <LoaderCircle className="spin" size={19} aria-label="Saving" />}
          </div>
          {detail.stops.length === 0 ? (
            <div className="empty-state"><MapPin size={30} /><h2>No pins on the map yet.</h2><p>Add a destination from the route board. Dates are validated before anything is saved.</p></div>
          ) : (
            <DndContext id="trip-stops" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={detail.stops.map((stop) => stop.id)} strategy={verticalListSortingStrategy}>
                <div className="stop-stack">
                  {detail.stops.map((stop) => (
                    <SortableStop
                      key={stop.id}
                      stop={stop}
                      selected={selectedStopId === stop.id}
                      onBrowse={() => browseActivities(stop)}
                      onDelete={() => deleteStop(stop)}
                      onDeleteActivity={(scheduledId, activityName) => deleteActivity(stop, scheduledId, activityName)}
                      busy={busy}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {selectedStop && activities.length > 0 && (
            <section className="activity-board">
              <div className="section-kicker">CITY BOARD · {selectedStop.city.name.toUpperCase()}</div>
              <div className="activity-grid">
                {activities.map((activity) => (
                  <article className="activity-card" key={activity.id}>
                    <div><span className="category-tag">{activity.category}</span><h3>{activity.name}</h3><p>{activity.description}</p></div>
                    <div className="activity-meta"><span>{activity.duration}h</span><strong>{formatMoney(activity.cost)}</strong></div>
                    <form className="schedule-form" onSubmit={(event) => addActivity(activity, event)}>
                      <input aria-label={`Date for ${activity.name}`} name="date" type="date" min={selectedStop.startDate} max={selectedStop.endDate} required defaultValue={selectedStop.startDate} />
                      <input aria-label={`Time for ${activity.name}`} name="startTime" type="time" defaultValue="10:00" />
                      <button className="button button-small button-primary" type="submit" disabled={busy}>Add</button>
                    </form>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>

        <aside className="planner-inspector">
          <section className="inspector-card budget-card">
            <div className="panel-heading"><span>LIVE BUDGET</span><DollarSign size={16} /></div>
            <strong className="budget-total">{formatMoney(detail.budget.spent)}</strong>
            <p>of {detail.budget.budget === null ? 'no limit set' : formatMoney(detail.budget.budget)}</p>
            {detail.budget.budget !== null && <div className="budget-track"><span style={{ width: `${budgetPercent}%` }} /></div>}
            <dl className="budget-breakdown">
              {Object.entries(detail.budget.byCategory).map(([category, amount]) => (
                <div key={category}><dt>{category}</dt><dd>{formatMoney(amount)}</dd></div>
              ))}
            </dl>
            {detail.expenses.length > 0 && (
              <div className="recorded-costs">
                <span className="recorded-costs-label">RECORDED COSTS</span>
                {detail.expenses.map((expense) => (
                  <div className="recorded-cost-row" key={expense.id}>
                    <span>
                      <strong>{expense.description || expense.category}</strong>
                      <small>{expense.date} · {expense.category}</small>
                    </span>
                    <span className="recorded-cost-actions">
                      <span className="mono">{formatMoney(expense.amount)}</span>
                      <button
                        className="icon-button danger recorded-cost-remove"
                        type="button"
                        onClick={() => deleteExpense(expense.id, expense.description)}
                        disabled={busy}
                        aria-label={`Remove ${expense.description || expense.category} cost`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
            <details className="inspector-form">
              <summary><Plus size={15} /> Add cost</summary>
              <form className="stack-form compact-form" onSubmit={addExpense}>
                <label>Category<select name="category" defaultValue="Transport"><option>Transport</option><option>Stay</option><option>Meals</option><option>Miscellaneous</option></select></label>
                <label>Amount<input name="amount" type="number" min="0.01" step="0.01" required /></label>
                <label>Date<input name="date" type="date" min={detail.trip.startDate} max={detail.trip.endDate} required /></label>
                <label>Attach to<select name="tripStopId" defaultValue=""><option value="">Whole trip</option>{detail.stops.map((stop) => <option key={stop.id} value={stop.id}>{stop.city.name}</option>)}</select></label>
                <label>Label<input name="description" maxLength={180} placeholder="Night train" /></label>
                <button className="button button-primary button-small" type="submit" disabled={busy}>Save cost</button>
              </form>
            </details>
          </section>

          <section className="inspector-card health-card">
            <div className="panel-heading"><span>TRIP HEALTH</span>{urgentIssues.length === 0 ? <Check size={17} /> : <CircleAlert size={17} />}</div>
            <div className={`health-score ${urgentIssues.length === 0 ? 'health-good' : 'health-attention'}`}>
              <strong>{urgentIssues.length === 0 ? 'CLEAR' : `${urgentIssues.length} CHECK${urgentIssues.length === 1 ? '' : 'S'}`}</strong>
              <small>Rules, not guesswork</small>
            </div>
            <ul className="health-list">
              {detail.health.length === 0 ? <li><Check size={15} /> Dates, schedule, and budget look good.</li> : detail.health.slice(0, 7).map((issue) => (
                <li key={issue.id} className={`health-${issue.severity}`}><CircleAlert size={15} /><span><strong>{issue.title}</strong><small>{issue.message}</small></span></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
