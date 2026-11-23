import os
import sys

# simple script to test connection to the local SQLite database

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from db.db_utils import DB_PATH, get_db_connection

try:
    connection = get_db_connection()

    print("Successfully connected to local SQLite database!")
    print(f"Database file: {DB_PATH}")

    cursor = connection.cursor()
    cursor.execute("SELECT sqlite_version()")
    print(f"SQLite version: {cursor.fetchone()[0]}")

    cursor.execute("SELECT 'Hello from SQLite!'")
    result = cursor.fetchone()
    print(f"Query result: {result[0]}")

    cursor.close()
    connection.close()
    print("Connection closed successfully.")

except Exception as error:
    print(f"Error connecting to database: {error}")
