import json
from typing import Any

from django.db import transaction

from api.models import StateDocument

AUTHORING_KEY = "authoring_records"
SOCIAL_KEY = "social_state"
AUDIT_KEY = "audit_logs"
ADMIN_KEY = "admin_console_state"


def deep_copy(value: Any) -> Any:
    return json.loads(json.dumps(value, ensure_ascii=False))


@transaction.atomic
def load_state(key: str, default_payload: dict[str, Any]) -> dict[str, Any]:
    doc, _ = StateDocument.objects.get_or_create(key=key, defaults={"payload": default_payload})
    payload = doc.payload
    if not isinstance(payload, dict):
        doc.payload = deep_copy(default_payload)
        doc.save(update_fields=["payload", "updated_at"])
        return deep_copy(default_payload)
    return deep_copy(payload)


@transaction.atomic
def save_state(key: str, payload: dict[str, Any]) -> None:
    StateDocument.objects.update_or_create(key=key, defaults={"payload": deep_copy(payload)})
