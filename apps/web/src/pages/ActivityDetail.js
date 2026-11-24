import { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AuthContext } from '../AuthContext';
import AppNav from './std/AppNav';
import { fetchActivity } from './dashboard/dashboardApi';

function formatWhen(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function secondsToPace(sec) {
  if (sec == null || Number.isNaN(sec)) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function StreamTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  let display = value;
  if (unit === 'pace') display = `${secondsToPace(value)} /mi`;
  else if (unit === 'hr') display = `${Math.round(value)} bpm`;
  else if (unit === 'ft') display = `${Math.round(value)} ft`;
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip__label">{Number(label).toFixed(1)} mi</div>
      <div className="dash-tooltip__value">{display}</div>
    </div>
  );
}

export default function ActivityDetail() {
  const { activityId } = useParams();
  const auth = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!auth?.authReady) return;
      if (!auth?.isAuthenticated) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchActivity(activityId);
        if (!cancelled) setData(payload);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load activity');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activityId, auth?.authReady, auth?.isAuthenticated]);

  const streams = data?.streams;
  const paceSeries =
    streams?.distance_mi?.map((mi, i) => ({
      mi,
      pace: streams.pace_sec_per_mi[i],
      hr: streams.heartrate[i],
      elev: streams.altitude_ft[i],
    })) || [];

  const waiting = !auth?.authReady || loading;

  return (
    <div className="dashboard-page">
      <AppNav />
      <main className="dashboard activity-detail">
        <p className="activity-detail__back">
          <Link to="/dashboard">← Dashboard</Link>
        </p>

        {waiting && (
          <div className="dashboard__state" role="status">
            Loading activity…
          </div>
        )}

        {!waiting && error && (
          <div className="dashboard__state dashboard__state--error" role="alert">
            <p>{error}</p>
            <Link to="/dashboard" className="dashboard__retry" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Back to dashboard
            </Link>
          </div>
        )}

        {!waiting && !error && data && (
          <>
            <header className="dashboard__intro">
              <p className="dashboard__eyebrow">{data.type}</p>
              <h1 className="dashboard__title">{data.name}</h1>
              <p className="dashboard__lede">{formatWhen(data.start_date_local)}</p>
            </header>

            <section className="dashboard__kpis" aria-label="Activity stats">
              <div className="dashboard__kpi">
                <div className="dashboard__kpi-value">{data.distance_mi}</div>
                <div className="dashboard__kpi-label">Miles</div>
              </div>
              <div className="dashboard__kpi">
                <div className="dashboard__kpi-value">{data.pace || '—'}</div>
                <div className="dashboard__kpi-label">Pace /mi</div>
              </div>
              <div className="dashboard__kpi">
                <div className="dashboard__kpi-value">{data.moving_time_label}</div>
                <div className="dashboard__kpi-label">Moving time</div>
              </div>
              <div className="dashboard__kpi">
                <div className="dashboard__kpi-value">
                  {data.elevation_ft != null ? Math.round(data.elevation_ft).toLocaleString() : '—'}
                </div>
                <div className="dashboard__kpi-label">Elevation ft</div>
              </div>
            </section>

            {(data.average_heartrate || data.max_heartrate) && (
              <p className="activity-detail__meta">
                Heart rate{' '}
                {data.average_heartrate ? `avg ${Math.round(data.average_heartrate)}` : null}
                {data.average_heartrate && data.max_heartrate ? ' · ' : null}
                {data.max_heartrate ? `max ${Math.round(data.max_heartrate)}` : null}
                {data.suffer_score != null ? ` · relative effort ${data.suffer_score}` : null}
              </p>
            )}

            {paceSeries.length > 0 && data.type === 'Run' && (
              <section className="dashboard__section">
                <h2 className="dashboard__section-title">Pace</h2>
                <div className="dash-chart" role="img" aria-label="Pace over distance">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={paceSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--rs-rule)" />
                      <XAxis
                        dataKey="mi"
                        tick={{ fill: 'var(--rs-ink-3)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--rs-rule)' }}
                        tickLine={false}
                        tickFormatter={(v) => Number(v).toFixed(1)}
                        minTickGap={28}
                      />
                      <YAxis
                        reversed
                        domain={['dataMin - 20', 'dataMax + 20']}
                        tickFormatter={secondsToPace}
                        tick={{ fill: 'var(--rs-ink-3)', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={44}
                        tickCount={5}
                      />
                      <Tooltip content={<StreamTooltip unit="pace" />} />
                      <Line
                        type="linear"
                        dataKey="pace"
                        stroke="var(--rs-accent)"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive
                        animationDuration={360}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {paceSeries.length > 0 && data.average_heartrate && (
              <section className="dashboard__section">
                <h2 className="dashboard__section-title">Heart rate</h2>
                <div className="dash-chart" role="img" aria-label="Heart rate over distance">
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={paceSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--rs-rule)" />
                      <XAxis
                        dataKey="mi"
                        tick={{ fill: 'var(--rs-ink-3)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--rs-rule)' }}
                        tickLine={false}
                        tickFormatter={(v) => Number(v).toFixed(1)}
                        minTickGap={28}
                      />
                      <YAxis
                        domain={['dataMin - 8', 'dataMax + 8']}
                        tick={{ fill: 'var(--rs-ink-3)', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Tooltip content={<StreamTooltip unit="hr" />} />
                      <Area
                        type="linear"
                        dataKey="hr"
                        stroke="var(--rs-chart-2)"
                        fill="var(--rs-accent-soft)"
                        strokeWidth={2}
                        isAnimationActive
                        animationDuration={360}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {paceSeries.length > 0 && data.elevation_ft > 0 && (
              <section className="dashboard__section">
                <h2 className="dashboard__section-title">Elevation</h2>
                <div className="dash-chart" role="img" aria-label="Elevation over distance">
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={paceSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--rs-rule)" />
                      <XAxis
                        dataKey="mi"
                        tick={{ fill: 'var(--rs-ink-3)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--rs-rule)' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'var(--rs-ink-3)', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip content={<StreamTooltip unit="ft" />} />
                      <Area
                        type="linear"
                        dataKey="elev"
                        stroke="var(--rs-ink-2)"
                        fill="var(--rs-rule)"
                        strokeWidth={1.5}
                        isAnimationActive
                        animationDuration={360}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {!data.mock && (
              <p className="dashboard__asof">
                <a href={data.strava_url} target="_blank" rel="noopener noreferrer">
                  Open on Strava
                </a>
              </p>
            )}
            {data.mock && (
              <p className="dashboard__asof">Demo activity — profiles are synthesized for preview.</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
