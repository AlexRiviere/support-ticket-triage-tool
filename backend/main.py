import csv

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from classifier import classify_ticket
from database import (
    delete_ticket,
    get_all_tickets_with_classifications,
    get_ticket,
    init_db,
    iter_tickets_with_classifications,
    save_classification,
    save_ticket,
)

app = FastAPI(title="Support Ticket Triage Tool")

MAX_TICKETS_PER_BATCH = 100
MAX_TEXT_LENGTH = 2000

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TicketIn(BaseModel):
    text: str
    source: str


@app.on_event("startup")
def on_startup():
    init_db()

@app.post("/tickets")
def create_tickets(tickets: list[TicketIn]):
    if len(tickets) > MAX_TICKETS_PER_BATCH:
        raise HTTPException(
            status_code=400,
            detail=f"Batch too large. Maximum {MAX_TICKETS_PER_BATCH} tickets per request."
        )

    skipped = []
    failed = []
    for ticket in tickets:
        if len(ticket.text) > MAX_TEXT_LENGTH:
            skipped.append(
                {
                    "text": ticket.text,
                    "reason": f"Text too long — max {MAX_TEXT_LENGTH} characters",
                }
            )
            continue

        result = classify_ticket(ticket.text)
        if not result["classified"]:
            failed.append({"text": ticket.text, "reason": result["reason"]})
            continue

        ticket_id = save_ticket(ticket.text, ticket.source)
        save_classification(
            ticket_id, result["category"], result["urgency_score"], result["classified"]
        )

    all_tickets = get_all_tickets_with_classifications()
    return {"tickets": all_tickets, "skipped": skipped, "failed": failed}


@app.get("/tickets")
def list_tickets():
    return get_all_tickets_with_classifications()


@app.delete("/tickets/{ticket_id}")
def remove_ticket(ticket_id: int):
    deleted = delete_ticket(ticket_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"deleted": ticket_id}


@app.post("/tickets/{ticket_id}/reclassify")
def reclassify_ticket(ticket_id: int):
    ticket = get_ticket(ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    result = classify_ticket(ticket["text"])
    save_classification(
        ticket_id, result["category"], result["urgency_score"], result["classified"]
    )

    return {**ticket, **result}


def sanitize_csv_value(value):
    if isinstance(value, str) and value.startswith(("=", "+", "-", "@")):
        return "'" + value
    return value


class _CSVEcho:
    """File-like object whose write() returns the string instead of buffering it."""

    def write(self, value):
        return value


def _generate_csv_rows():
    writer = csv.writer(_CSVEcho())
    yield writer.writerow(
        ["id", "text", "category", "urgency_score", "classified", "source", "created_at"]
    )
    for row in iter_tickets_with_classifications():
        yield writer.writerow(
            [
                row["id"],
                sanitize_csv_value(row["text"]),
                row.get("category"),
                row.get("urgency_score"),
                row.get("classified"),
                sanitize_csv_value(row["source"]),
                row["created_at"],
            ]
        )


@app.get("/export")
def export_csv():
    return StreamingResponse(
        _generate_csv_rows(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tickets_export.csv"},
    )
