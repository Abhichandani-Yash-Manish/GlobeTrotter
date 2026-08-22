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
  ArrowDown,
  ArrowUp,
  GripVertical,
  ListChecks,
  LoaderCircle,
  MapPinned,
  MapPin,
  Pencil,
  Plus,
  Search,
  Send,
  Settings2,
  SlidersHorizontal,
  Trash2,
  Users,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { RouteRibbon } from '@/components/route-ribbon';
import { RouteMap } from '@/components/route-map';
import { StatusMessage } from '@/components/status-message';
import { BudgetVisualization } from '@/components/budget-visualization';
import { TripCollaboration } from '@/components/trip-collaboration';
import { TripMetadataEditor } from '@/components/trip-metadata-editor';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { requestJson } from '@/lib/client-api';
import { formatMoney } from '@/lib/format';
import type { ActivityDto, CityDto, PlannerStop, RouteMapData, TripDetail } from '@/types/domain';

function SortableStop({
  stop,
  selected,
  onBrowse,
  onDelete,
  onDeleteActivity,
  onUpdateStop,
  onUpdateActivity,
  onMoveActivity,
  busy,
  canEdit,
}: {
  stop: PlannerStop;
  selected: boolean;
  onBrowse: () => void;
  onDelete: () => void;
  onDeleteActivity: (scheduledId: string, activityName: string) => void;
  onUpdateStop: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateActivity: (scheduledId: string, event: FormEvent<HTMLFormElement>) => void;
  onMoveActivity: (scheduledId: string, direction: -1 | 1) => void;
  busy: boolean;
  canEdit: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });
  const cardTransition = [transition, 'box-shadow .2s var(--route-ease)', 'border-color .2s ease', 'background .2s ease']
    .filter(Boolean)
    .join(', ');
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition: cardTransition }}
      className={`stop-card ${selected ? 'stop-card-selected' : ''} ${isDragging ? 'is-dragging' : ''}`}
    >
      <div className="stop-card-topline">
        <button className="drag-handle" type="button" disabled={!canEdit} aria-label={`Reorder ${stop.city.name}`} {...attributes} {...listeners}>
          <GripVertical size={19} />
        </button>
        <span className="route-code">{String(stop.order + 1).padStart(2, '0')}</span>
        <div>
          <h3>{stop.city.name}</h3>
          <p>{stop.city.country} · {stop.startDate} → {stop.endDate}</p>
        </div>
        <button className="icon-button danger" type="button" onClick={onDelete} disabled={busy || !canEdit} aria-label={`Remove ${stop.city.name}`}>
          <Trash2 size={17} />
        </button>
      </div>
      {stop.notes && <p className="stop-notes">“{stop.notes}”</p>}
      <div className="scheduled-list">
        {stop.activities.length === 0 ? (
          <p className="muted-copy">No activities yet. Keep the day open or add one from the city board.</p>
        ) : (
          stop.activities.map((scheduled, activityIndex) => (
            <div className="scheduled-row" key={scheduled.id}>
              <span className="mono">{scheduled.startTime ?? 'FLEX'}</span>
              <span><strong>{scheduled.activity.name}</strong><small>{scheduled.date} · {scheduled.duration}h</small></span>
              <span className="scheduled-actions">
                <span className="mono">{formatMoney(scheduled.cost)}</span>
                <button className="icon-button" type="button" onClick={() => onMoveActivity(scheduled.id, -1)} disabled={!canEdit || busy || activityIndex === 0} aria-label={`Move ${scheduled.activity.name} earlier`}><ArrowUp size={13} /></button>
                <button className="icon-button" type="button" onClick={() => onMoveActivity(scheduled.id, 1)} disabled={!canEdit || busy || activityIndex === stop.activities.length - 1} aria-label={`Move ${scheduled.activity.name} later`}><ArrowDown size={13} /></button>
                <button
                  className="icon-button danger scheduled-remove"
                  type="button"
                  onClick={() => onDeleteActivity(scheduled.id, scheduled.activity.name)}
                  disabled={busy || !canEdit}
                  aria-label={`Remove ${scheduled.activity.name} from ${stop.city.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </span>
              {canEdit && <details className="quick-edit"><summary><Pencil size={13} /> Edit</summary><form className="quick-edit-form" onSubmit={(event) => onUpdateActivity(scheduled.id, event)}><label>Date<input name="date" type="date" min={stop.startDate} max={stop.endDate} defaultValue={scheduled.date} required /></label><label>Time<input name="startTime" type="time" defaultValue={scheduled.startTime ?? ''} /></label><label>Hours<input name="duration" type="number" min="0.25" max="24" step="0.25" defaultValue={scheduled.duration} required /></label><label>Cost<input name="cost" type="number" min="0" step="0.01" defaultValue={scheduled.cost} required /></label><label className="full-field">Notes<input name="notes" maxLength={500} defaultValue={scheduled.notes ?? ''} /></label><button className="button button-dark button-small" type="submit" disabled={busy}>Save activity</button></form></details>}
            </div>
          ))
        )}
      </div>
      {canEdit && <details className="quick-edit stop-quick-edit"><summary><Pencil size={14} /> Edit stop details</summary><form className="quick-edit-form" onSubmit={onUpdateStop}><label>Arrive<input name="startDate" type="date" defaultValue={stop.startDate} required /></label><label>Depart<input name="endDate" type="date" defaultValue={stop.endDate} required /></label><label>Mode<select name="arrivalMode" defaultValue={stop.arrivalMode}><option value="train">Train</option><option value="flight">Flight</option><option value="drive">Drive</option><option value="transit">Transit</option><option value="bike">Bike</option><option value="walk">Walk</option><option value="other">Other</option></select></label><label>Travel minutes<input name="arrivalDurationMinutes" type="number" min="1" defaultValue={stop.arrivalDurationMinutes ?? ''} /></label><label className="full-field">Notes<input name="notes" maxLength={500} defaultValue={stop.notes ?? ''} /></label><button className="button button-dark button-small" type="submit" disabled={busy}>Save stop</button></form></details>}
      <button className="button button-ghost button-small" type="button" onClick={onBrowse} disabled={!canEdit}>
        <Plus size={16} /> {selected ? 'Activity board open' : 'Browse activities'}
      </button>
    </article>
  );
}

export function PlannerClient({
  initialDetail,
  initialCities,
  initialMapData,
}: {
  initialDetail: TripDetail;
  initialCities: CityDto[];
  initialMapData: RouteMapData;
}) {
  const [detail, setDetail] = useState(initialDetail);
  const [cities, setCities] = useState(initialCities);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(initialDetail.stops[0]?.id ?? null);
  const [activities, setActivities] = useState<ActivityDto[]>([]);
  const [activityBoardOpen, setActivityBoardOpen] = useState(false);
  const [mapData, setMapData] = useState(initialMapData);
  const [mobileTab, setMobileTab] = useState<'plan' | 'map' | 'budget'>('plan');
  const [openPanel, setOpenPanel] = useState<'details' | 'crew' | null>(null);
  const [activityFilters, setActivityFilters] = useState({ q: '', category: 'All', maxCost: '', maxDuration: '' });
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
  const canEdit = detail.access === 'OWNER' || detail.access === 'EDITOR' || detail.access === undefined;
  const canPublish = detail.access === 'OWNER' || detail.access === undefined;

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
      setMapData(await requestJson<RouteMapData>(`/api/trips/${detail.trip.id}/map`));
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
          arrivalMode: form.get('arrivalMode'),
          arrivalDurationMinutes: form.get('arrivalDurationMinutes') ? Number(form.get('arrivalDurationMinutes')) : null,
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
    setActivityBoardOpen(true);
    setBusy(true);
    try {
      const params = new URLSearchParams(Object.entries(activityFilters).filter(([, value]) => value && value !== 'All'));
      setActivities(await requestJson<ActivityDto[]>(`/api/cities/${stop.cityId}/activities?${params}`));
      setMessage(null);
    } catch (error) {
      report(error instanceof Error ? error.message : 'Could not load activities.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function filterActivities(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStop) return;
    const form = new FormData(event.currentTarget);
    const filters = {
      q: String(form.get('q') ?? ''), category: String(form.get('category') ?? 'All'),
      maxCost: String(form.get('maxCost') ?? ''), maxDuration: String(form.get('maxDuration') ?? ''),
    };
    setActivityFilters(filters);
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value && value !== 'All'));
    setBusy(true);
    try { setActivities(await requestJson<ActivityDto[]>(`/api/cities/${selectedStop.cityId}/activities?${params}`)); }
    catch (error) { report(error instanceof Error ? error.message : 'Could not filter activities.', 'error'); }
    finally { setBusy(false); }
  }

  async function updateStop(stop: PlannerStop, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await updateDetail(() => requestJson<TripDetail>(`/api/trips/${detail.trip.id}/stops/${stop.id}`, {
      method: 'PUT', body: JSON.stringify({ startDate: form.get('startDate'), endDate: form.get('endDate'), notes: form.get('notes'), arrivalMode: form.get('arrivalMode'), arrivalDurationMinutes: form.get('arrivalDurationMinutes') ? Number(form.get('arrivalDurationMinutes')) : null }),
    }), `${stop.city.name} details saved.`);
  }

  async function updateActivity(stop: PlannerStop, scheduledId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await updateDetail(() => requestJson<TripDetail>(`/api/trips/${detail.trip.id}/stops/${stop.id}/activities/${scheduledId}`, {
      method: 'PUT', body: JSON.stringify({ date: form.get('date'), startTime: form.get('startTime') || null, duration: Number(form.get('duration')), cost: Number(form.get('cost')), notes: form.get('notes') }),
    }), 'Activity details saved.');
  }

  async function moveActivity(stop: PlannerStop, scheduledId: string, direction: -1 | 1) {
    const currentIndex = stop.activities.findIndex((item) => item.id === scheduledId);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= stop.activities.length) return;
    const reordered = arrayMove(stop.activities, currentIndex, targetIndex);
    await updateDetail(() => requestJson<TripDetail>(`/api/trips/${detail.trip.id}/stops/${stop.id}/activities/reorder`, {
      method: 'PUT', body: JSON.stringify({ orderedIds: reordered.map((item) => item.id) }),
    }), 'Activity order saved.');
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
          {canEdit && <button className="button button-ghost" type="button" onClick={() => setOpenPanel(openPanel === 'details' ? null : 'details')}><Settings2 size={17} /> Trip details</button>}
          <button className="button button-ghost" type="button" onClick={() => setOpenPanel(openPanel === 'crew' ? null : 'crew')}><Users size={17} /> {detail.collaborators?.length ?? 1}</button>
          {canPublish && <button className="button button-dark" type="button" onClick={publishTrip} disabled={busy}>
            <Send size={17} /> {detail.trip.isPublic ? 'Make private' : 'Publish'}
          </button>}
          {detail.trip.isPublic && (
            <button className="icon-button" type="button" onClick={copyShareLink} aria-label="Copy share link">
              <Copy size={17} />
            </button>
          )}
        </div>
      </div>

      {openPanel === 'details' && <TripMetadataEditor detail={detail} covers={initialCities} onUpdated={setDetail} onClose={() => setOpenPanel(null)} />}
      {openPanel === 'crew' && <TripCollaboration detail={detail} onClose={() => setOpenPanel(null)} />}

      <StatusMessage message={message} tone={messageTone} stamp={message === 'Trip published. The share link is live.'} />
      <div className="planner-mobile-route"><RouteRibbon stops={detail.stops} health={detail.health} compact /></div>

      <nav className="planner-mobile-tabs" aria-label="Planner views"><button type="button" className={mobileTab === 'plan' ? 'active' : ''} onClick={() => setMobileTab('plan')}><ListChecks size={16} /> Plan</button><button type="button" className={mobileTab === 'map' ? 'active' : ''} onClick={() => setMobileTab('map')}><MapPinned size={16} /> Map</button><button type="button" className={mobileTab === 'budget' ? 'active' : ''} onClick={() => setMobileTab('budget')}><WalletCards size={16} /> Budget</button></nav>

      <div className={`planner-grid mobile-tab-${mobileTab}`}>
        <aside className="planner-route-panel planner-plan-region">
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
              <label>Arrival mode<select name="arrivalMode" defaultValue="train"><option value="train">Train</option><option value="flight">Flight</option><option value="drive">Drive</option><option value="transit">Transit</option><option value="bike">Bike</option><option value="walk">Walk</option><option value="other">Other</option></select></label>
              <label>Travel minutes<input name="arrivalDurationMinutes" type="number" min="1" placeholder="Optional" /></label>
              <label>Notes<input name="notes" maxLength={500} placeholder="Train at 08:10, check-in after 3" /></label>
              <button className="button button-primary button-small" type="submit" disabled={busy}><Plus size={15} /> Add to route</button>
            </form>
          </details>
        </aside>

        <section className="planner-canvas planner-plan-region" aria-label="Itinerary stops">
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
                      onUpdateStop={(event) => updateStop(stop, event)}
                      onUpdateActivity={(scheduledId, event) => updateActivity(stop, scheduledId, event)}
                      onMoveActivity={(scheduledId, direction) => moveActivity(stop, scheduledId, direction)}
                      busy={busy}
                      canEdit={canEdit}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className="planner-map-region"><div className="canvas-heading"><div><span>LIVE ATLAS</span><p>Select a map node to focus its itinerary stop.</p></div><small>{mapData.source === 'geoapify' ? 'ROUTED' : 'GEODESIC ESTIMATE'}</small></div><RouteMap data={mapData} selectedStopId={selectedStopId} onSelectStop={setSelectedStopId} /></div>

          {selectedStop && activityBoardOpen && (
            <section className="activity-board">
              <div className="section-kicker">CITY BOARD · {selectedStop.city.name.toUpperCase()}</div>
              <form className="activity-filters" onSubmit={filterActivities}><label className="search-field"><Search size={15} /><input name="q" placeholder="Search activities" defaultValue={activityFilters.q} /></label><select name="category" defaultValue={activityFilters.category} aria-label="Activity category"><option>All</option><option>Sightseeing</option><option>Culture</option><option>Food & Drink</option><option>Nature</option><option>Shopping</option><option>Adventure</option></select><input name="maxCost" type="number" min="0" placeholder="Max $" aria-label="Maximum activity cost" defaultValue={activityFilters.maxCost} /><input name="maxDuration" type="number" min="0.5" step="0.5" placeholder="Max hours" aria-label="Maximum activity duration" defaultValue={activityFilters.maxDuration} /><button className="button button-dark button-small" type="submit" disabled={busy}><SlidersHorizontal size={14} /> Filter</button></form>
              <div className="activity-grid">
                {activities.map((activity) => (
                  <article className="activity-card" key={activity.id}>
                    <div className="activity-card-image"><ImageWithFallback src={activity.imageUrl} alt={activity.name} sizes="280px" /></div><div><span className="category-tag">{activity.category}</span><h3>{activity.name}</h3><p>{activity.description}</p><small className="activity-location"><MapPin size={12} /> {activity.address}</small></div>
                    <div className="activity-meta"><span>{activity.duration}h</span><strong>{formatMoney(activity.cost)}</strong></div>
                    <form className="schedule-form" onSubmit={(event) => addActivity(activity, event)}>
                      <input aria-label={`Date for ${activity.name}`} name="date" type="date" min={selectedStop.startDate} max={selectedStop.endDate} required defaultValue={selectedStop.startDate} />
                      <input aria-label={`Time for ${activity.name}`} name="startTime" type="time" defaultValue="10:00" />
                      <button className="button button-small button-primary" type="submit" disabled={busy}>Add</button>
                    </form>
                  </article>
                ))}
              </div>
              {activities.length === 0 && <div className="empty-state compact-empty"><MapPin size={24} /><h2>No matching activities.</h2><p>Clear one of the filters to reopen the city board.</p></div>}
            </section>
          )}
        </section>

        <aside className="planner-inspector planner-budget-region">
          <section className="inspector-card budget-card">
            <div className="panel-heading"><span>LIVE BUDGET</span><DollarSign size={16} /></div>
            <strong className="budget-total">{formatMoney(detail.budget.spent)}</strong>
            <p>of {detail.budget.budget === null ? 'no limit set' : formatMoney(detail.budget.budget)}</p>
            {detail.budget.budget !== null && <div className="budget-track"><span style={{ width: `${budgetPercent}%` }} /></div>}
            <BudgetVisualization detail={detail} compact />
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
            {canEdit && <details className="inspector-form">
              <summary><Plus size={15} /> Add cost</summary>
              <form className="stack-form compact-form" onSubmit={addExpense}>
                <label>Category<select name="category" defaultValue="Transport"><option>Transport</option><option>Stay</option><option>Meals</option><option>Miscellaneous</option></select></label>
                <label>Amount<input name="amount" type="number" min="0.01" step="0.01" required /></label>
                <label>Date<input name="date" type="date" min={detail.trip.startDate} max={detail.trip.endDate} required /></label>
                <label>Attach to<select name="tripStopId" defaultValue=""><option value="">Whole trip</option>{detail.stops.map((stop) => <option key={stop.id} value={stop.id}>{stop.city.name}</option>)}</select></label>
                <label>Label<input name="description" maxLength={180} placeholder="Night train" /></label>
                <button className="button button-primary button-small" type="submit" disabled={busy}>Save cost</button>
              </form>
            </details>}
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
