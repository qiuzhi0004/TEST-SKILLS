from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from django.conf import settings
from django.db import transaction

from api.models import AdminCategory, AdminTag, ContentRecord, ContentStatus, StateDocument
from api.services.state_store import ADMIN_KEY, AUDIT_KEY, AUTHORING_KEY, SOCIAL_KEY, load_state, save_state

CONTENT_FILES: dict[str, str] = {
    "prompt": "prompts.json",
    "mcp": "mcps.json",
    "skill": "skills.json",
    "tutorial": "tutorials.json",
}


def now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")


def parse_iso(value: str | None) -> datetime:
    if not value:
        return datetime.now(tz=timezone.utc)
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def to_iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def make_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


def _data_dir() -> Path:
    return Path(settings.REPO_ROOT) / "data"


def _load_json(filename: str) -> Any:
    path = _data_dir() / filename
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _normalize_category_ids(content: dict[str, Any]) -> list[str]:
    category_ids = content.get("category_ids")
    if isinstance(category_ids, list) and category_ids:
        return [str(item) for item in category_ids]
    category_id = content.get("category_id")
    if category_id:
        return [str(category_id)]
    return []


def _default_authoring_state() -> dict[str, Any]:
    return {"records": []}


def _default_social_state() -> dict[str, Any]:
    return {
        "favorites": {},
        "votes": {},
        "comments": {},
    }


def _default_audit_state() -> dict[str, Any]:
    return {"logs": []}


def seed_taxonomy_models(force: bool = False) -> None:
    if force:
        AdminCategory.objects.all().delete()
        AdminTag.objects.all().delete()

    if AdminCategory.objects.exists() and AdminTag.objects.exists() and not force:
        return

    taxonomies = _load_json("taxonomies.json")
    timestamp = parse_iso(now_iso())

    for item in taxonomies.get("categories", []):
        category_id = str(item.get("id", "")).strip()
        if not category_id:
            continue
        AdminCategory.objects.update_or_create(
            id=category_id,
            defaults={
                "name": str(item.get("name", category_id)),
                "parent_id": None,
                "description": "导入自 taxonomies.json",
                "status": "active",
                "usage_count": 0,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
        )

    for item in taxonomies.get("tags", []):
        tag_id = str(item.get("id", "")).strip()
        if not tag_id:
            continue
        AdminTag.objects.update_or_create(
            id=tag_id,
            defaults={
                "name": str(item.get("name", tag_id)),
                "status": "active",
                "usage_count": 0,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
        )


def _build_default_admin_state() -> dict[str, Any]:
    timestamp = now_iso()
    return {
        "events": [
            {
                "id": make_id("event"),
                "at": timestamp,
                "actor": "admin-local",
                "type": "system.seed",
                "target_type": "system",
                "summary": "初始化 admin_console 默认数据。",
                "payload": {
                    "categories": AdminCategory.objects.count(),
                    "tags": AdminTag.objects.count(),
                },
            }
        ]
    }


@transaction.atomic
def seed_content_records(force: bool = False) -> None:
    if force:
        ContentRecord.objects.all().delete()

    if ContentRecord.objects.exists() and not force:
        return

    for content_type, filename in CONTENT_FILES.items():
        items = _load_json(filename)
        for item in items:
            content = item.get("content", {})
            resource_id = str(content.get("id", "")).strip()
            if not resource_id:
                continue

            defaults = {
                "content_type": content_type,
                "status": content.get("status", ContentStatus.LISTED),
                "title": content.get("title", ""),
                "one_liner": content.get("one_liner"),
                "category_ids": _normalize_category_ids(content),
                "tag_ids": [str(v) for v in content.get("tag_ids", [])],
                "author_id": content.get("author_id", "user-001"),
                "cover_asset_id": content.get("cover_asset_id"),
                "created_at": parse_iso(content.get("created_at")),
                "updated_at": parse_iso(content.get("updated_at")),
                "detail": item,
            }
            ContentRecord.objects.update_or_create(resource_id=resource_id, defaults=defaults)


@transaction.atomic
def seed_state_documents(force: bool = False) -> None:
    if force:
        StateDocument.objects.filter(key__in=[AUTHORING_KEY, SOCIAL_KEY, AUDIT_KEY, ADMIN_KEY]).delete()

    load_state(AUTHORING_KEY, _default_authoring_state())
    load_state(SOCIAL_KEY, _default_social_state())
    load_state(AUDIT_KEY, _default_audit_state())
    admin_state = load_state(ADMIN_KEY, _build_default_admin_state())
    if not admin_state.get("events"):
        save_state(ADMIN_KEY, _build_default_admin_state())


@transaction.atomic
def ensure_bootstrapped(force: bool = False) -> None:
    seed_content_records(force=force)
    seed_taxonomy_models(force=force)
    seed_state_documents(force=force)
