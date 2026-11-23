import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import Dashboard from './Dashboard';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

jest.mock('./dashboard/WeeklyChart', () => () => <div data-testid="weekly-chart" />);
jest.mock('./dashboard/PaceChart', () => () => <div data-testid="pace-chart" />);

const sample = {
  success: true,
  window_days: 28,
  as_of: '2026-11-23T20:00:00+00:00',
  mock: true,
  summary: {
    activity_count: 12,
    run_count: 10,
    distance_mi: 42.6,
    moving_time_label: '5h 12m',
    moving_time_s: 18720,
    avg_run_pace: '7:42',
    elevation_ft: 1200,
    active_days_last_7: 4,
  },
  weekly: [
    { week_start: '2026-11-03', distance_mi: 10.2, run_distance_mi: 10.2, activities: 3, avg_run_pace: '7:50' },
    { week_start: '2026-11-10', distance_mi: 14.1, run_distance_mi: 12.0, activities: 4, avg_run_pace: '7:35' },
    { week_start: '2026-11-17', distance_mi: 18.3, run_distance_mi: 16.0, activities: 5, avg_run_pace: '7:40' },
  ],
  recent: [
    {
      id: 1,
      name: 'Tempo — Riverside',
      type: 'Run',
      start_date_local: '2026-11-22T07:00:00Z',
      distance_mi: 7.1,
      moving_time: 3200,
      moving_time_label: '53m 20s',
      pace: '7:30',
      elevation_ft: 120,
      strava_url: 'https://www.strava.com/activities/1',
    },
  ],
  highlights: [{ label: 'Longest run', name: 'Long run', value: '16.2 mi', id: 2 }],
  sport_mix: [
    { type: 'Run', count: 10, distance_mi: 40 },
    { type: 'Ride', count: 2, distance_mi: 2.6 },
  ],
  athlete: { first_name: 'Alex', last_name: 'Runner', id: 900001 },
};

function wrap(ui) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          isAuthenticated: true,
          authReady: true,
          firstName: 'Alex',
          logout: jest.fn(),
        }}
      >
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

test('renders dashboard metrics from API payload', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => sample,
    })
  );

  wrap(<Dashboard />);

  await waitFor(() => {
    expect(screen.getByText(/Alex's last 28 days/i)).toBeInTheDocument();
  });
  expect(screen.getByText('42.6')).toBeInTheDocument();
  expect(screen.getByText('7:42')).toBeInTheDocument();
  expect(screen.getByText(/Tempo — Riverside/)).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Lookback')).toBeInTheDocument();
});

test('shows empty state when there are no activities', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({
        ...sample,
        summary: { ...sample.summary, activity_count: 0, run_count: 0, distance_mi: 0 },
        recent: [],
        weekly: [],
        highlights: [],
      }),
    })
  );

  wrap(<Dashboard />);

  await waitFor(() => {
    expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
  });
});
