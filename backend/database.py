import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

DB_PATH = "triage.db"


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                source TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS classifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER NOT NULL,
                category TEXT NOT NULL,
                urgency_score INTEGER NOT NULL,
                classified INTEGER NOT NULL DEFAULT 1,
                classified_at TEXT NOT NULL,
                FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE
            )
            """
        )


def save_ticket(text: str, source: str) -> int:
    created_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO tickets (text, source, created_at) VALUES (?, ?, ?)",
            (text, source, created_at),
        )
        return cursor.lastrowid


def save_classification(
    ticket_id: int, category: str, urgency_score: int, classified: bool = True
) -> int:
    classified_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        conn.execute("DELETE FROM classifications WHERE ticket_id = ?", (ticket_id,))
        cursor = conn.execute(
            "INSERT INTO classifications (ticket_id, category, urgency_score, classified, classified_at) VALUES (?, ?, ?, ?, ?)",
            (ticket_id, category, urgency_score, classified, classified_at),
        )
        return cursor.lastrowid


def get_ticket(ticket_id: int) -> dict | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM tickets WHERE id = ?", (ticket_id,)
        ).fetchone()
        return dict(row) if row else None


def delete_ticket(ticket_id: int) -> bool:
    with get_connection() as conn:
        conn.execute("DELETE FROM classifications WHERE ticket_id = ?", (ticket_id,))
        cursor = conn.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))
        return cursor.rowcount > 0


_TICKETS_WITH_CLASSIFICATIONS_QUERY = """
    SELECT
        t.id AS id,
        t.text AS text,
        t.source AS source,
        t.created_at AS created_at,
        c.category AS category,
        c.urgency_score AS urgency_score,
        c.classified AS classified,
        c.classified_at AS classified_at
    FROM tickets t
    LEFT JOIN classifications c ON c.ticket_id = t.id
    ORDER BY c.urgency_score DESC, t.created_at DESC
"""


def iter_tickets_with_classifications():
    """Yield ticket+classification rows one at a time, keeping the cursor open."""
    with get_connection() as conn:
        cursor = conn.execute(_TICKETS_WITH_CLASSIFICATIONS_QUERY)
        for row in cursor:
            row_dict = dict(row)
            if row_dict["classified"] is not None:
                row_dict["classified"] = bool(row_dict["classified"])
            yield row_dict


def get_all_tickets_with_classifications() -> list[dict]:
    return list(iter_tickets_with_classifications())
