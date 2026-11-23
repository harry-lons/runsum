function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

export async function fetchDashboard(days = 28) {
  const csrfToken = getCookie('csrf_access_token');
  const response = await fetch(`${API_BASE_URL}/api/dashboard?days=${days}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const err = new Error(`Dashboard request failed (${response.status})`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

export async function mockLogin() {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code: 'mock' }),
  });
  if (!response.ok) {
    throw new Error('Mock login failed — is STRAVA_MOCK enabled on the API?');
  }
  return response.json();
}
