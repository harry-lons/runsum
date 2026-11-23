# RunSum

Monorepo for [runsum.harrylons.com](https://runsum.harrylons.com).

- `apps/web` — Create React App frontend
- `apps/api` — Flask API with local SQLite (`apps/api/db/runsum.sqlite`)

After Strava login you land on the **Dashboard** (recent training, no date range). **Lookback** is the original date-range retrospective, reachable from the top nav.

## Develop

```bash
npm run install:all
npm run dev
```

- Web: http://localhost:3010
- API: http://localhost:3011

`dev` enables **mock Strava** by default (`STRAVA_MOCK=1`) so you can click **Preview dashboard (demo data)** on the home page without a Strava app. Set `STRAVA_MOCK=0` and fill real `CLIENT_ID` / `CLIENT_SECRET` / `JWT_SECRET` to use live Strava.

For live OAuth, register the callback URL as `http://localhost:3010/dashboard` (and production `https://runsum.harrylons.com/dashboard`).

### Tests

```bash
# API (mock Strava + dashboard)
cd apps/api && .venv/bin/python -m unittest tests.test_dashboard_mock -v

# Web
CI=true npm test --prefix apps/web -- --watchAll=false
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run install:all` | Web `npm ci` + API venv |
| `npm run dev` | API `:3011` + web `:3010` |
| `npm run smoke` | Health checks (servers already up) |
