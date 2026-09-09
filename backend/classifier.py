import json
import os

import anthropic

MODEL = "claude-haiku-4-5"

VALID_CATEGORIES = {"billing", "technical", "account", "general"}

FALLBACK_RESULT = {"category": "general", "urgency_score": 5, "classified": False}

SYSTEM_PROMPT = (
    "You are a support ticket triage assistant. Read the ticket text and classify it. "
    "Choose exactly one category: billing, technical, account, or general. "
    "Assign an urgency_score from 1 (not urgent) to 10 (extremely urgent) based on the "
    "impact and tone of the ticket."
)

OUTPUT_SCHEMA = {
    "type": "json_schema",
    "schema": {
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "enum": ["billing", "technical", "account", "general"],
            },
            "urgency_score": {
                "type": "integer",
                "enum": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            },
        },
        "required": ["category", "urgency_score"],
        "additionalProperties": False,
    },
}

_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def _fallback(reason: str) -> dict:
    result = dict(FALLBACK_RESULT)
    result["reason"] = reason
    return result


def classify_ticket(text: str) -> dict:
    try:
        client = _get_client()
        response = client.messages.create(
            model=MODEL,
            max_tokens=256,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": text}],
            output_config={"format": OUTPUT_SCHEMA},
        )

        raw = next(block.text for block in response.content if block.type == "text")
        data = json.loads(raw)

        category = data.get("category")
        urgency_score = data.get("urgency_score")

        if category not in VALID_CATEGORIES:
            raise ValueError(f"Invalid category returned: {category}")
        if not isinstance(urgency_score, int) or not (1 <= urgency_score <= 10):
            raise ValueError(f"Invalid urgency_score returned: {urgency_score}")

        return {"category": category, "urgency_score": urgency_score, "classified": True}

    except anthropic.AuthenticationError:
        print("Classifier error: invalid or missing ANTHROPIC_API_KEY")
        return _fallback("API key invalid")
    except anthropic.RateLimitError:
        print("Classifier error: rate limited by Anthropic API")
        return _fallback("Rate limited — try again")
    except anthropic.APIStatusError as e:
        print(f"Classifier error: API status error ({e.status_code}): {e.message}")
        return _fallback("API error")
    except anthropic.APIConnectionError:
        print("Classifier error: network error connecting to Anthropic API")
        return _fallback("API error")
    except (StopIteration, json.JSONDecodeError, ValueError, KeyError) as e:
        print(f"Classifier error: malformed response ({e})")
        return _fallback("API error")
    except Exception as e:
        print(f"Classifier error: unexpected error ({e})")
        return _fallback("Unexpected error")
