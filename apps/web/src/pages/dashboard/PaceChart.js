import {
  ResponsiveContainer,
  LineChart,
  Line,
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

function paceToSeconds(pace) {
  if (!pace || typeof pace !== 'string') return null;
  const [m, s] = pace.split(':').map(Number);
  if (Number.isNaN(m) || Number.isNaN(s)) return null;
  return m * 60 + s;
}

function secondsToPace(sec) {
  if (sec == null || Number.isNaN(sec)) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip__label">Week of {shortWeekLabel(label)}</div>
      <div className="dash-tooltip__value">{secondsToPace(payload[0].value)} /mi</div>
    </div>
  );
}

export default function PaceChart({ weekly }) {
  const data = (weekly || [])
    .map((w) => ({
      week_start: w.week_start,
      paceSec: paceToSeconds(w.avg_run_pace),
    }))
    .filter((w) => w.paceSec != null);

  if (!data.length) {
    return <p className="dash-empty">Not enough run pace data in this window.</p>;
  }

  return (
    <div className="dash-chart" role="img" aria-label="Average run pace by week">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--rs-rule)" />
          <XAxis
            dataKey="week_start"
            tickFormatter={shortWeekLabel}
            tick={{ fill: 'var(--rs-ink-3)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--rs-rule)' }}
            tickLine={false}
          />
          <YAxis
            reversed
            domain={['dataMin - 15', 'dataMax + 15']}
            tickFormatter={secondsToPace}
            tick={{ fill: 'var(--rs-ink-3)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="linear"
            dataKey="paceSec"
            stroke="var(--rs-chart-2)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--rs-accent)', strokeWidth: 0 }}
            isAnimationActive
            animationDuration={400}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
