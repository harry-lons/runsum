"""Mock Strava data for local development without a live Strava account."""

from .strava_mock import (
    is_mock_mode,
    mock_athlete,
    mock_login_tokens,
    mock_fetch_activities,
    build_dashboard_payload,
)

__all__ = [
    "is_mock_mode",
    "mock_athlete",
    "mock_login_tokens",
    "mock_fetch_activities",
    "build_dashboard_payload",
]
