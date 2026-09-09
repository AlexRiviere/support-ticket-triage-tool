import csv
import io

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
    for ticket in tickets:
        if len(ticket.text) > MAX_TEXT_LENGTH:
            skipped.append({"text": ticket.text[:50] + "...", "reason": "text too long"})
            continue

        ticket_id = save_ticket(ticket.text, ticket.source)
        result = classify_ticket(ticket.text)
        save_classification(
            ticket_id, result["category"], result["urgency_score"], result["classified"]
        )

    all_tickets = get_all_tickets_with_classifications()
    return {"tickets": all_tickets, "skipped": skipped}


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

@app.get("/export")
def export_csv():
    rows = get_all_tickets_with_classifications()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["id", "text", "category", "urgency_score", "classified", "source", "created_at"]
    )
    for row in rows:
        writer.writerow(
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

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tickets_export.csv"},
    )
