import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

function shortWeekLabel(isoDate) {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip__label">Week of {shortWeekLabel(label)}</div>
      <div className="dash-tooltip__value">{row.distance_mi} mi</div>
      <div className="dash-tooltip__meta">{row.activities} activities</div>
    </div>
  );
}

export default function WeeklyChart({ weekly }) {
  const data = (weekly || []).map((w) => ({
    ...w,
    label: shortWeekLabel(w.week_start),
  }));

  return (
    <div className="dash-chart" role="img" aria-label="Weekly distance chart">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--rs-rule)" strokeDasharray="0" />
          <XAxis
            dataKey="week_start"
            tickFormatter={shortWeekLabel}
            tick={{ fill: 'var(--rs-ink-3)', fontSize: 12, fontFamily: 'IBM Plex Sans, sans-serif' }}
            axisLine={{ stroke: 'var(--rs-rule)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--rs-ink-3)', fontSize: 12, fontFamily: 'IBM Plex Sans, sans-serif' }}
            axisLine={false}
            tickLine={false}
            width={36}
            unit=""
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--rs-accent-soft)' }} />
          <Bar
            dataKey="distance_mi"
            fill="var(--rs-accent)"
            radius={[2, 2, 0, 0]}
            maxBarSize={48}
            isAnimationActive
            animationDuration={360}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
