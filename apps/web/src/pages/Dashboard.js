import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import AppNav from './std/AppNav';
import { fetchDashboard } from './dashboard/dashboardApi';
import WeeklyChart from './dashboard/WeeklyChart';
import PaceChart from './dashboard/PaceChart';

function formatActivityDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function Dashboard() {
  const auth = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

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
        const payload = await fetchDashboard(28);
        if (!cancelled) setData(payload);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [auth?.authReady, auth?.isAuthenticated, reloadKey]);

  const summary = data?.summary;
  const name = auth?.firstName || data?.athlete?.first_name || '';
  const waitingOnAuth = !auth?.authReady;

  return (
    <div className="dashboard-page">
      <AppNav />

      <main className="dashboard">
        {(waitingOnAuth || loading) && (
          <div className="dashboard__state" role="status">
            Loading training…
          </div>
        )}

        {!waitingOnAuth && !loading && error && (
          <div className="dashboard__state dashboard__state--error" role="alert">
            <p>{error}</p>
            <button type="button" className="dashboard__retry" onClick={retry}>
              Try again
            </button>
          </div>
        )}

        {!waitingOnAuth && !loading && !error && data && summary?.activity_count === 0 && (
          <div className="dashboard__state">
            <h1 className="dashboard__title">No recent activity</h1>
            <p className="dashboard__lede">
              Nothing in the last {data.window_days} days. Open Lookback for a custom range, or sync a workout on Strava.
            </p>
          </div>
        )}

        {!waitingOnAuth && !loading && !error && data && summary?.activity_count > 0 && (
          <>
            <header className="dashboard__intro">
              <p className="dashboard__eyebrow">Training</p>
              <h1 className="dashboard__title">
                {name ? `${name}'s last ${data.window_days} days` : `Last ${data.window_days} days`}
              </h1>
              <p className="dashboard__lede">
                {summary.run_count} runs
                {data.mock ? ' · demo data' : ''}
              </p>
            </header>

            <section className="dashboard__kpis" aria-label="Summary">
              <div className="dashboard__kpi">
                <div className="dashboard__kpi-value">{summary.distance_mi}</div>
                <div className="dashboard__kpi-label">Miles</div>
              </div>
              <div className="dashboard__kpi">
                <div className="dashboard__kpi-value">{summary.avg_run_pace || '—'}</div>
                <div className="dashboard__kpi-label">Avg run pace /mi</div>
              </div>
              <div className="dashboard__kpi">
                <div className="dashboard__kpi-value">{summary.moving_time_label}</div>
                <div className="dashboard__kpi-label">Moving time</div>
              </div>
              <div className="dashboard__kpi">
                <div className="dashboard__kpi-value">{summary.active_days_last_7}/7</div>
                <div className="dashboard__kpi-label">Days active (this week)</div>
              </div>
            </section>

            <section className="dashboard__section">
              <h2 className="dashboard__section-title">Weekly distance</h2>
              <WeeklyChart weekly={data.weekly} />
            </section>

            <section className="dashboard__section">
              <h2 className="dashboard__section-title">Run pace trend</h2>
              <PaceChart weekly={data.weekly} />
            </section>

            <section className="dashboard__section">
              <h2 className="dashboard__section-title">Recent</h2>
              <div className="dash-feed__head" aria-hidden="true">
                <span>Date</span>
                <span>Activity</span>
                <span className="dash-feed__num">Dist</span>
                <span className="dash-feed__num">Pace</span>
                <span className="dash-feed__num">Time</span>
              </div>
              <ul className="dash-feed">
                {data.recent.map((act) => (
                  <li key={act.id}>
                    <a
                      className="dash-feed__row"
                      href={act.strava_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="dash-feed__date">{formatActivityDate(act.start_date_local)}</span>
                      <span className="dash-feed__main">
                        <span className="dash-feed__name">{act.name}</span>
                        <span className="dash-feed__type">{act.type}</span>
                      </span>
                      <span className="dash-feed__num">{act.distance_mi} mi</span>
                      <span className="dash-feed__num">{act.pace ? `${act.pace}` : '—'}</span>
                      <span className="dash-feed__num">{act.moving_time_label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            {data.highlights?.length > 0 && (
              <section className="dashboard__section">
                <h2 className="dashboard__section-title">Highlights</h2>
                <ul className="dash-highlights">
                  {data.highlights.map((h) => (
                    <li key={h.label} className="dash-highlights__row">
                      <span className="dash-highlights__label">{h.label}</span>
                      <span className="dash-highlights__name">{h.name}</span>
                      <span className="dash-highlights__value">{h.value}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.sport_mix?.some((s) => s.count > 0) && (
              <section className="dashboard__section">
                <h2 className="dashboard__section-title">Sport mix</h2>
                <ul className="dash-mix">
                  {data.sport_mix
                    .filter((s) => s.count > 0)
                    .map((s) => (
                      <li key={s.type} className="dash-mix__row">
                        <span>{s.type}</span>
                        <span>
                          {s.count} · {s.distance_mi} mi
                        </span>
                      </li>
                    ))}
                </ul>
              </section>
            )}

            <p className="dashboard__asof">
              Updated {new Date(data.as_of).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
              {' · '}
              {Math.round(summary.elevation_ft).toLocaleString()} ft elevation
            </p>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
