import os
import sqlite3
import threading
from datetime import datetime

# Local database file. Nothing is imported from the previous Oracle database.
_DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(_DB_DIR, "runsum.sqlite")
_SCHEMA_PATH = os.path.join(_DB_DIR, "schemas.sql")

_init_lock = threading.Lock()
_schema_ready = False


def _adapt_datetime(value):
    return value.isoformat()


def _convert_timestamp(value):
    text = value.decode() if isinstance(value, bytes) else value
    return datetime.fromisoformat(text)


sqlite3.register_adapter(datetime, _adapt_datetime)
sqlite3.register_converter("timestamp", _convert_timestamp)


def _apply_schema(connection):
    with open(_SCHEMA_PATH, encoding="utf-8") as schema_file:
        connection.executescript(schema_file.read())


def get_db_connection():
    """Create and return a database connection"""
    global _schema_ready
    try:
        connection = sqlite3.connect(
            DB_PATH,
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
    except sqlite3.Error as error:
        print(f"Error connecting to database: {error}")
        raise

    try:
        with _init_lock:
            if not _schema_ready:
                _apply_schema(connection)
                _schema_ready = True
        return connection
    except Exception:
        connection.close()
        raise


def init_db():
    """Create the local SQLite file and tables if they do not exist."""
    connection = get_db_connection()
    connection.close()


def get_athlete_by_id(strava_athlete_id):
    """Fetch athlete data from database by Strava ID"""
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            SELECT StravaAthleteID, firstname, lastname, firstlogin, lastlogin,
                   access_token, ref_token, exp_at
            FROM athlete
            WHERE StravaAthleteID = ?
        """, [strava_athlete_id])

        result = cursor.fetchone()

        if result:
            return {
                'strava_id': result[0],
                'firstname': result[1],
                'lastname': result[2],
                'firstlogin': result[3],
                'lastlogin': result[4],
                'access_token': result[5],
                'refresh_token': result[6],
                'expires_at': result[7]
            }
        return None
    finally:
        cursor.close()
        connection.close()

def create_athlete(strava_athlete_id, firstname, lastname, access_token, refresh_token, expires_at):
    """Insert new athlete into database"""
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        now = datetime.now()
        cursor.execute("""
            INSERT INTO athlete
            (StravaAthleteID, firstname, lastname, firstlogin, lastlogin,
             access_token, ref_token, exp_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [strava_athlete_id, firstname, lastname, now, now,
              access_token, refresh_token, expires_at])

        connection.commit()
        return True
    except sqlite3.Error as error:
        print(f"Error creating athlete: {error}")
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()

def update_athlete_tokens(strava_athlete_id, access_token, refresh_token, expires_at):
    """Update athlete's Strava tokens"""
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        now = datetime.now()
        cursor.execute("""
            UPDATE athlete
            SET access_token = ?,
                ref_token = ?,
                exp_at = ?,
                lastlogin = ?
            WHERE StravaAthleteID = ?
        """, [access_token, refresh_token, expires_at, now, strava_athlete_id])

        connection.commit()
        return True
    except sqlite3.Error as error:
        print(f"Error updating athlete tokens: {error}")
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()

def update_athlete_name(strava_athlete_id, firstname, lastname):
    """Update athlete's name (in case they changed it on Strava)"""
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            UPDATE athlete
            SET firstname = ?,
                lastname = ?
            WHERE StravaAthleteID = ?
        """, [firstname, lastname, strava_athlete_id])

        connection.commit()
        return True
    except sqlite3.Error as error:
        print(f"Error updating athlete name: {error}")
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()
