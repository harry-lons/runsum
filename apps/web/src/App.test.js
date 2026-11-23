import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// AuthContext calls whoami on mount; stub fetch so the home page stays put.
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status: 401,
      json: async () => ({ error: 'unauthorized' }),
    })
  );
});

test('renders Strava connect on home', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByAltText(/connect with strava/i)).toBeInTheDocument();
  expect(screen.getByText(/preview dashboard/i)).toBeInTheDocument();
});
