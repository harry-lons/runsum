# Runsum Backend - SQLite Database Integration Testing Guide

This guide will help you test the complete authentication flow with the local SQLite database.

## Overview

The backend uses a local SQLite database (`db/runsum.sqlite`) to store and manage athlete data and Strava credentials. The file is created on startup. Existing Oracle data is not imported. The flow works as follows:

1. **User authenticates** via Strava OAuth → Backend receives auth code
2. **Backend exchanges code** for Strava tokens (access_token, refresh_token, expires_at)
3. **Backend stores/updates** athlete data and tokens in the local SQLite database
4. **Backend returns JWT** to frontend for session management
5. **Subsequent requests** use JWT for authentication, while backend fetches Strava tokens from database

## Prerequisites

### 1. Environment Variables
Ensure your `.env` file contains:

```bash
# Strava OAuth
CLIENT_ID=your_strava_client_id
CLIENT_SECRET=your_strava_client_secret

# Frontend
FRONTEND_URL=http://localhost:3000

# Security
SECURE=false  # Set to true in production with HTTPS
JWT_SECRET=your_jwt_secret
```

### 2. Database Setup

The API creates `db/runsum.sqlite` and the tables in `db/schemas.sql` on startup. You do not need a separate database client.

### 3. Test Database Connection

Test your database connection:

```bash
cd db
python dbtest.py
```

You should see:
```
Successfully connected to local SQLite database!
Database file: /path/to/apps/api/db/runsum.sqlite
SQLite version: X.X.X
Query result: Hello from SQLite!
Connection closed successfully.
```

## Running the Backend

Start the Flask application:

```bash
python main.py
```

The server will start on `http://localhost:3011`.

## Testing the Full Authentication Flow

### Step 1: Get a Strava Authorization Code

1. Visit this URL in your browser (replace `YOUR_CLIENT_ID` with your actual Strava Client ID):

```
https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=read,activity:read_all
```

2. Authorize the application
3. You'll be redirected to `http://localhost/?code=XXXXXXXXX`
4. Copy the `code` value from the URL

### Step 2: Run the Test Script

1. Open `test_auth_flow.py`
2. Replace `AUTH_CODE = "YOUR_AUTH_CODE_HERE"` with your actual code
3. Run the test:

```bash
python test_auth_flow.py
```

### Expected Output

```
============================================================
STARTING FULL AUTHENTICATION FLOW TEST
============================================================
Base URL: http://localhost:3011
Date Range: 2024-10-08 to 2024-11-08

============================================================
Testing /auth/login endpoint...
============================================================
Status Code: 200
Response: {
  "first_name": "John",
  "id": 12345678,
  "success": true
}
✅ Login successful!

============================================================
Testing /auth/whoami endpoint...
============================================================
Status Code: 200
Response: {
  "first_name": "John",
  "last_name": "Doe",
  "id": 12345678,
  "success": true
}
✅ Whoami successful! User data retrieved from database.

============================================================
Testing /activities endpoint...
============================================================
Status Code: 200
✅ Activities fetched successfully!
Number of activities: 25

First 3 activities:
  Activity 1:
    Name: Morning Run
    Type: Run
    Distance: 5000.00 meters
    Date: 2024-11-07T08:30:00

...

============================================================
TEST SUMMARY
============================================================
✅ Login: Success
✅ Whoami: Success
✅ Get Activities: Success

All tests completed!
============================================================
```

## API Endpoints

### POST `/auth/login`
Authenticates a user with Strava and stores their data in the database.

**Request:**
```json
{
  "code": "strava_auth_code"
}
```

**Response:**
```json
{
  "first_name": "John",
  "id": 12345678,
  "success": true
}
```

**What happens:**
1. Exchanges auth code for Strava tokens
2. Fetches athlete data from Strava
3. Checks if athlete exists in database
4. Creates new record or updates existing tokens
5. Returns JWT cookie for subsequent requests

### GET `/auth/whoami`
Returns current user information from the database.

**Headers:** Requires JWT cookie

**Response:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "id": 12345678,
  "success": true
}
```

### GET `/activities`
Fetches user's activities from Strava using tokens stored in database.

**Headers:** Requires JWT cookie

**Query Parameters:**
- `after`: ISO 8601 datetime string (e.g., "2024-10-01T00:00:00")
- `before`: ISO 8601 datetime string (e.g., "2024-11-01T00:00:00")

**Response:**
```json
{
  "activities": [
    {
      "id": 123456789,
      "name": "Morning Run",
      "distance": 5000.0,
      "moving_time": 1800.0,
      "type": "Run",
      "start_date": "2024-11-07T08:30:00",
      ...
    }
  ],
  "count": 25,
  "success": true
}
```

### POST `/auth/logout`
Clears JWT authentication cookies.

**Headers:** Requires JWT cookie

**Response:**
```json
{
  "msg": "logout successful"
}
```

## Database Functions (db_utils.py)

### `get_athlete_by_id(strava_athlete_id)`
Fetches athlete data by Strava ID.

### `create_athlete(strava_athlete_id, firstname, lastname, access_token, refresh_token, expires_at)`
Creates a new athlete record in the database.

### `update_athlete_tokens(strava_athlete_id, access_token, refresh_token, expires_at)`
Updates athlete's Strava tokens and last login timestamp.

### `update_athlete_name(strava_athlete_id, firstname, lastname)`
Updates athlete's name (in case it changed on Strava).

## Troubleshooting

### Connection Issues

**Error:** `Error connecting to database`
- Confirm the process can write `db/runsum.sqlite`
- Check the SQLite error printed by the API

### Authentication Issues

**Error:** `Failed to authenticate`
- Strava auth codes expire quickly (10 minutes) - get a fresh one
- Verify `CLIENT_ID` and `CLIENT_SECRET` are correct in `.env`
- Check that Strava app redirect URI includes `http://localhost`

### Token Issues

**Error:** `User not found in database`
- User must authenticate via `/auth/login` first
- Check database connection and table existence

## Architecture Notes

### Why JWT + Database?

- **JWT (Frontend ↔ Backend)**: Fast, stateless authentication for API requests
- **Database (Backend ↔ Strava)**: Secure storage of Strava tokens, enables token refresh without re-auth

### Security Considerations

1. Strava tokens are stored in the database, not in JWT
2. JWT only contains user ID and first name (non-sensitive data)
3. Access tokens can expire - future enhancement: implement token refresh logic
4. Use HTTPS in production (`SECURE=true`)

## Next Steps

1. **Token Refresh**: Implement automatic token refresh when access_token expires
2. **Activity Caching**: Store activities in database to reduce Strava API calls
3. **Error Handling**: Add more robust error handling for token expiration
4. **Rate Limiting**: Implement rate limiting to respect Strava's API limits

## Files Overview

```
runsum-backend/
├── main.py                 # Flask application with routes
├── helpers.py             # Strava OAuth helper functions
├── db/
│   ├── db_utils.py        # Database connection and query functions
│   ├── dbtest.py          # Database connection test
│   └── schemas.sql        # SQL schema definitions
├── tests/
│   ├── test_auth_flow.py  # Test script for full auth flow
│   ├── TESTING_GUIDE.md   # This file
│   └── CHANGES_SUMMARY.md # Changes documentation
├── db/runsum.sqlite       # Local SQLite database (created on startup, not in git)
└── .env                   # Environment variables (not in git)
```


