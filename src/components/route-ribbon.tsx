import { Check, CircleAlert, MapPin } from 'lucide-react';
import type { PlannerStop, TripHealthIssue } from '@/types/domain';

export function RouteRibbon({
  stops,
  health,
  compact = false,
}: {
  stops: PlannerStop[];
  health: TripHealthIssue[];
  compact?: boolean;
}) {
  if (stops.length === 0) {
    return <div className="route-empty">Your route begins with one destination.</div>;
  }

  return (
    <ol
      className={`route-ribbon ${compact ? 'route-ribbon-compact' : ''}`}
      aria-label="Trip route"
      tabIndex={compact ? 0 : undefined}
    >
      {stops.map((stop, index) => {
        const issues = health.filter((issue) => issue.stopId === stop.id);
        const hasError = issues.some((issue) => issue.severity === 'error');
        const hasWarning = issues.some((issue) => issue.severity === 'warning');
        return (
          <li key={stop.id}>
            <span className={`route-node ${hasError ? 'node-error' : hasWarning ? 'node-warning' : 'node-good'}`}>
              {hasError || hasWarning ? <CircleAlert size={15} /> : index === stops.length - 1 ? <MapPin size={15} /> : <Check size={15} />}
            </span>
            <span className="route-copy">
              <strong>{stop.city.name}</strong>
              <small>{stop.startDate.slice(5)} → {stop.endDate.slice(5)}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
