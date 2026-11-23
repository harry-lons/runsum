# RunSum

Monorepo for [runsum.harrylons.com](https://runsum.harrylons.com).

- `apps/web` — Create React App frontend, from [`harry-lons/runsum-fe-nonorg`](https://github.com/harry-lons/runsum-fe-nonorg) `main`
- `apps/api` — Flask API, from [`harry-lons/runsum-be-nonorg`](https://github.com/harry-lons/runsum-be-nonorg) `main`

`apps/api/vercel.json` routes API requests to Flask. Locally, `npm run dev` runs the API and web app together.

## Develop

```bash
npm run install:all
npm run dev
```

`install:all` (`scripts/cloud-install.sh`) installs the web npm dependencies and a Python virtualenv at `apps/api/venv`.

`dev` (`scripts/cloud-start.sh`) starts the API on port 3011 and the web app on port 3010. The web app calls the API at `http://localhost:3011` unless `REACT_APP_BACKEND_URL` is already set.

Each app still has its own README for Strava credentials and environment variables. The API keeps its data in a local SQLite file, `apps/api/db/runsum.sqlite`, created on startup.
