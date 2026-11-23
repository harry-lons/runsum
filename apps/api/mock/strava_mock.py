"""Strava mock helpers: fixture activities + dashboard aggregation."""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

MOCK_ATHLETE_ID = 900001
_FIXTURE_PATH = Path(__file__).with_name("activities.json")


def is_mock_mode() -> bool:
    return os.getenv("STRAVA_MOCK", "").lower() in ("1", "true", "yes", "on")


@lru_cache(maxsize=1)
def _load_fixture() -> dict[str, Any]:
    with _FIXTURE_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def mock_athlete() -> dict[str, Any]:
    athlete = _load_fixture()["athlete"]
    return {
        "id": athlete["id"],
        "firstname": athlete["firstname"],
        "lastname": athlete["lastname"],
    }


def mock_login_tokens() -> tuple[str, str, datetime]:
    expires_at = datetime.now() + timedelta(days=30)
    return "mock-access-token", "mock-refresh-token", expires_at


def _parse_activity_ts(value: str) -> datetime:
    # Fixture uses Zulu ISO strings.
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    return datetime.fromisoformat(value)


def mock_fetch_activities(after_epoch, before_epoch, page, per_page: int = 200) -> list[dict]:
    after = int(after_epoch)
    before = int(before_epoch)
    page = int(page)
    activities = _load_fixture()["activities"]

    filtered = []
    for activity in activities:
        ts = int(_parse_activity_ts(activity["start_date"]).timestamp())
        if after <= ts <= before:
            filtered.append(activity)

    # Newest first already; paginate like Strava.
    start = (page - 1) * per_page
    end = start + per_page
    return filtered[start:end]


def _meters_to_miles(meters: float) -> float:
    return meters / 1609.344


def _format_pace(meters: float, moving_time: float) -> str | None:
    if not meters or not moving_time or meters < 1:
        return None
    # min per mile
    sec_per_mile = moving_time / _meters_to_miles(meters)
    if sec_per_mile <= 0 or sec_per_mile > 60 * 30:
        return None
    minutes = int(sec_per_mile // 60)
    seconds = int(sec_per_mile % 60)
    return f"{minutes}:{seconds:02d}"


def _format_duration(seconds: float) -> str:
    seconds = int(seconds or 0)
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    if hours:
        return f"{hours}h {minutes:02d}m"
    return f"{minutes}m {secs:02d}s"


def _week_start(dt: datetime) -> datetime:
    local = dt.astimezone(timezone.utc)
    monday = local - timedelta(days=local.weekday())
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)


def build_dashboard_payload(activities: list[dict], window_days: int = 28) -> dict[str, Any]:
    """Aggregate a Strava activity list into dashboard sections."""
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=window_days)

    in_window = []
    for activity in activities:
        ts = _parse_activity_ts(activity["start_date"])
        if ts >= window_start:
            in_window.append(activity)

    runs = [a for a in in_window if a.get("type") == "Run" or a.get("sport_type") == "Run"]
    rides = [a for a in in_window if a.get("type") in ("Ride", "VirtualRide") or a.get("sport_type") in ("Ride", "VirtualRide")]
    swims = [a for a in in_window if a.get("type") == "Swim" or a.get("sport_type") == "Swim"]

    total_distance = sum(a.get("distance") or 0 for a in in_window)
    total_moving = sum(a.get("moving_time") or 0 for a in in_window)
    run_distance = sum(a.get("distance") or 0 for a in runs)
    run_moving = sum(a.get("moving_time") or 0 for a in runs)
    elev = sum(a.get("total_elevation_gain") or 0 for a in in_window)

    # Weekly buckets covering the window
    weeks: dict[str, dict[str, float]] = {}
    cursor = _week_start(window_start)
    end_week = _week_start(now)
    while cursor <= end_week:
        key = cursor.date().isoformat()
        weeks[key] = {"distance_m": 0.0, "moving_s": 0.0, "run_distance_m": 0.0, "run_moving_s": 0.0, "count": 0}
        cursor += timedelta(days=7)

    for activity in in_window:
        ts = _parse_activity_ts(activity["start_date"])
        key = _week_start(ts).date().isoformat()
        if key not in weeks:
            weeks[key] = {"distance_m": 0.0, "moving_s": 0.0, "run_distance_m": 0.0, "run_moving_s": 0.0, "count": 0}
        bucket = weeks[key]
        dist = float(activity.get("distance") or 0)
        moving = float(activity.get("moving_time") or 0)
        bucket["distance_m"] += dist
        bucket["moving_s"] += moving
        bucket["count"] += 1
        if activity.get("type") == "Run" or activity.get("sport_type") == "Run":
            bucket["run_distance_m"] += dist
            bucket["run_moving_s"] += moving

    weekly = []
    for key in sorted(weeks.keys()):
        bucket = weeks[key]
        weekly.append({
            "week_start": key,
            "distance_mi": round(_meters_to_miles(bucket["distance_m"]), 2),
            "run_distance_mi": round(_meters_to_miles(bucket["run_distance_m"]), 2),
            "activities": int(bucket["count"]),
            "avg_run_pace": _format_pace(bucket["run_distance_m"], bucket["run_moving_s"]),
        })

    # Consistency: activity days in last 7 days
    last_7 = now - timedelta(days=7)
    active_days = {
        _parse_activity_ts(a["start_date"]).date().isoformat()
        for a in in_window
        if _parse_activity_ts(a["start_date"]) >= last_7
    }

    recent = []
    for activity in sorted(in_window, key=lambda a: a["start_date"], reverse=True)[:15]:
        dist = float(activity.get("distance") or 0)
        moving = float(activity.get("moving_time") or 0)
        recent.append({
            "id": activity.get("id"),
            "name": activity.get("name"),
            "type": activity.get("type") or activity.get("sport_type"),
            "start_date_local": activity.get("start_date_local") or activity.get("start_date"),
            "distance_mi": round(_meters_to_miles(dist), 2),
            "moving_time": int(moving),
            "moving_time_label": _format_duration(moving),
            "pace": _format_pace(dist, moving) if (activity.get("type") == "Run") else None,
            "elevation_ft": round((activity.get("total_elevation_gain") or 0) * 3.28084, 0),
            "average_heartrate": activity.get("average_heartrate"),
            "strava_url": f"https://www.strava.com/activities/{activity.get('id')}",
        })

    highlights = []
    if runs:
        longest = max(runs, key=lambda a: a.get("distance") or 0)
        fastest = min(
            (a for a in runs if (a.get("distance") or 0) >= 3000),
            key=lambda a: (a.get("moving_time") or 1) / max(a.get("distance") or 1, 1),
            default=None,
        )
        climbiest = max(runs, key=lambda a: a.get("total_elevation_gain") or 0)
        highlights.append({
            "label": "Longest run",
            "name": longest.get("name"),
            "value": f"{_meters_to_miles(longest.get('distance') or 0):.1f} mi",
            "id": longest.get("id"),
        })
        if fastest:
            highlights.append({
                "label": "Fastest pace (≥3 mi)",
                "name": fastest.get("name"),
                "value": _format_pace(fastest.get("distance") or 0, fastest.get("moving_time") or 0) + " /mi",
                "id": fastest.get("id"),
            })
        highlights.append({
            "label": "Most elevation",
            "name": climbiest.get("name"),
            "value": f"{(climbiest.get('total_elevation_gain') or 0) * 3.28084:.0f} ft",
            "id": climbiest.get("id"),
        })

    sport_mix = [
        {"type": "Run", "count": len(runs), "distance_mi": round(_meters_to_miles(sum(a.get("distance") or 0 for a in runs)), 2)},
        {"type": "Ride", "count": len(rides), "distance_mi": round(_meters_to_miles(sum(a.get("distance") or 0 for a in rides)), 2)},
        {"type": "Swim", "count": len(swims), "distance_mi": round(_meters_to_miles(sum(a.get("distance") or 0 for a in swims)), 2)},
    ]

    return {
        "window_days": window_days,
        "as_of": now.isoformat(),
        "summary": {
            "activity_count": len(in_window),
            "run_count": len(runs),
            "distance_mi": round(_meters_to_miles(total_distance), 2),
            "moving_time_label": _format_duration(total_moving),
            "moving_time_s": int(total_moving),
            "avg_run_pace": _format_pace(run_distance, run_moving),
            "elevation_ft": round(elev * 3.28084, 0),
            "active_days_last_7": len(active_days),
        },
        "weekly": weekly,
        "recent": recent,
        "highlights": highlights,
        "sport_mix": sport_mix,
        "mock": is_mock_mode(),
    }
