"""API tests for mock Strava login + dashboard aggregation."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path

# Ensure apps/api is on the path when pytest/unittest is launched from repo root.
API_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(API_ROOT))

os.environ["STRAVA_MOCK"] = "1"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["FRONTEND_URL"] = "http://localhost:3010"
os.environ["SECURE"] = "false"

# Point SQLite at a temp file before importing the app.
_tmp = tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False)
_tmp.close()
os.environ["RUNSUM_DB_PATH"] = _tmp.name

from db import db_utils as db  # noqa: E402

db.DB_PATH = _tmp.name
db._schema_ready = False

import main as app_module  # noqa: E402


class DashboardMockTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = app_module.app.test_client()

    def test_mock_login_whoami_dashboard(self):
        login = self.client.post("/api/auth/login", json={"code": "mock"})
        self.assertEqual(login.status_code, 200, login.get_data(as_text=True))
        body = login.get_json()
        self.assertTrue(body["success"])
        self.assertEqual(body["first_name"], "Alex")
        self.assertTrue(body.get("mock"))

        who = self.client.get("/api/auth/whoami")
        self.assertEqual(who.status_code, 200)
        self.assertEqual(who.get_json()["first_name"], "Alex")

        dash = self.client.get("/api/dashboard?days=28")
        self.assertEqual(dash.status_code, 200, dash.get_data(as_text=True))
        payload = dash.get_json()
        self.assertTrue(payload["success"])
        self.assertGreater(payload["summary"]["activity_count"], 0)
        self.assertGreater(payload["summary"]["distance_mi"], 0)
        self.assertTrue(payload["weekly"])
        self.assertTrue(payload["recent"])
        self.assertTrue(payload["mock"])

    def test_activities_mock_pagination(self):
        self.client.post("/api/auth/login", json={"code": "demo"})
        # Broad window covering fixture range
        after = 1700000000
        before = 2000000000
        page1 = self.client.get(f"/api/activities?after={after}&before={before}&page=1")
        self.assertEqual(page1.status_code, 200)
        data = page1.get_json()
        self.assertTrue(data["success"])
        self.assertGreater(data["count"], 0)

    def test_dashboard_requires_auth(self):
        # Fresh client without cookies
        naked = app_module.app.test_client()
        resp = naked.get("/api/dashboard")
        self.assertEqual(resp.status_code, 401)

    def test_activity_detail(self):
        self.client.post("/api/auth/login", json={"code": "mock"})
        dash = self.client.get("/api/dashboard?days=28").get_json()
        activity_id = dash["recent"][0]["id"]
        detail = self.client.get(f"/api/activities/{activity_id}")
        self.assertEqual(detail.status_code, 200, detail.get_data(as_text=True))
        body = detail.get_json()
        self.assertTrue(body["success"])
        self.assertEqual(body["id"], activity_id)
        self.assertTrue(body["name"])
        self.assertTrue(body["streams"])
        self.assertGreater(len(body["streams"]["distance_mi"]), 10)

        missing = self.client.get("/api/activities/1")
        self.assertEqual(missing.status_code, 404)


if __name__ == "__main__":
    unittest.main()
