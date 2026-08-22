'use client';

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney } from '@/lib/format';
import type { TripDetail } from '@/types/domain';

const COLORS = ['#0E7C7B', '#17324D', '#FF6B57', '#F6C445', '#7EA9B7'];

export function BudgetVisualization({ detail, compact = false }: { detail: TripDetail; compact?: boolean }) {
  const categories = Object.entries(detail.budget.byCategory)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));
  const daily = new Map<string, number>();
  detail.stops.forEach((stop) => stop.activities.forEach((item) => daily.set(item.date, (daily.get(item.date) ?? 0) + item.cost)));
  detail.expenses.forEach((expense) => daily.set(expense.date, (daily.get(expense.date) ?? 0) + expense.amount));
  const perDay = [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, spent]) => ({ date: date.slice(5), spent, over: detail.budget.overBudgetDays.includes(date) }));
  const ceiling = detail.budget.budget === null ? null : detail.budget.budget / Math.max(1, Math.round((new Date(`${detail.trip.endDate}T00:00:00Z`).getTime() - new Date(`${detail.trip.startDate}T00:00:00Z`).getTime()) / 86400000) + 1);

  return (
    <div className={`budget-visuals ${compact ? 'budget-visuals-compact' : ''}`}>
      <section className="budget-chart-card" aria-label="Budget by category">
        <div className="budget-chart-heading"><span>CATEGORY MIX</span><strong>{formatMoney(detail.budget.spent)}</strong></div>
        {categories.length ? <div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius="57%" outerRadius="82%" paddingAngle={2} isAnimationActive>{categories.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => formatMoney(Number(value))} /></PieChart></ResponsiveContainer><div><strong>{detail.budget.budget === null ? 'OPEN' : `${Math.round((detail.budget.spent / detail.budget.budget) * 100)}%`}</strong><small>used</small></div></div> : <p className="muted-copy">Add an activity or cost to begin the chart.</p>}
        <ul className="budget-legend">{categories.map((item, index) => <li key={item.name}><i style={{ background: COLORS[index % COLORS.length] }} /><span>{item.name}</span><strong>{formatMoney(item.value)}</strong></li>)}</ul>
      </section>
      <section className="budget-chart-card daily-chart-card" aria-label="Daily spend">
        <div className="budget-chart-heading"><span>DAILY SPEND</span><strong>{ceiling === null ? 'No ceiling' : `${formatMoney(ceiling)}/day`}</strong></div>
        {perDay.length ? <ResponsiveContainer width="100%" height={compact ? 190 : 250}><BarChart data={perDay} margin={{ top: 10, right: 4, left: -22, bottom: 0 }}><CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#cad9df" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => formatMoney(Number(value))} /><Bar dataKey="spent" radius={[4, 4, 0, 0]} isAnimationActive>{perDay.map((day) => <Cell key={day.date} fill={day.over ? '#FF6B57' : '#0E7C7B'} />)}</Bar></BarChart></ResponsiveContainer> : <p className="muted-copy">Daily totals will appear as the itinerary fills in.</p>}
        {detail.budget.overBudgetDays.length > 0 && <p className="chart-warning">Coral bars exceed the current per-day ceiling.</p>}
      </section>
    </div>
  );
}

