from __future__ import annotations

import re
from datetime import datetime, timezone as dt_timezone
from typing import Any
from uuid import uuid4

from django.contrib.auth.models import User
from django.db.models import Q
from django.http import Http404
from django.utils import timezone as dj_timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import AdminCategory, AdminTag, ContentRecord
from api.services.seed import ensure_bootstrapped
from api.services.state_store import ADMIN_KEY, AUDIT_KEY, AUTHORING_KEY, SOCIAL_KEY, load_state, save_state

ALLOWED_TYPES = {"prompt", "mcp", "skill", "tutorial"}
CONTENT_STATUSES = {
    "Draft",
    "PendingReview",
    "Reject",
    "Approved",
    "Listed",
    "Unlisted",
    "Deleted",
}

DEFAULT_ACTOR = "admin-local"
PHONE_PATTERN = re.compile(r"^1\d{10}$")
MOCK_SMS_CODE = "123456"


def now_iso() -> str:
    return dj_timezone.now().astimezone(dt_timezone.utc).isoformat().replace("+00:00", "Z")


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(dt_timezone.utc)
    except ValueError:
        return None


def parse_int(value: str | None, default: int, minimum: int = 0) -> int:
    if value is None:
        return default
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return max(minimum, parsed)


def create_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


def make_target_key(target_type: str, target_id: str) -> str:
    return f"{target_type}:{target_id}"


def clone_json(value: Any) -> Any:
    import json

    return json.loads(json.dumps(value, ensure_ascii=False))


def ensure_seeded() -> None:
    ensure_bootstrapped(force=False)


def ensure_content_type(content_type: str) -> str:
    if content_type not in ALLOWED_TYPES:
        raise ValidationError(f"Unsupported content type: {content_type}")
    return content_type


def ensure_status(value: str) -> str:
    if value not in CONTENT_STATUSES:
        raise ValidationError(f"Unsupported status: {value}")
    return value


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9\u4e00-\u9fa5]+", "-", value.strip().lower()).strip("-")


def ensure_phone(value: str) -> str:
    phone = str(value or "").strip()
    if not PHONE_PATTERN.match(phone):
        raise ValidationError({"detail": "phone must be a valid 11-digit number"})
    return phone


def ensure_mock_code(value: str) -> str:
    code = str(value or "").strip()
    if code != MOCK_SMS_CODE:
        raise ValidationError({"detail": "验证码错误，请输入 123456"})
    return code


def serialize_phone_user(user: User) -> dict[str, str]:
    nickname = user.first_name.strip() if user.first_name else ""
    if not nickname:
        nickname = f"用户{user.username[-4:]}" if len(user.username) >= 4 else "用户"
    return {
        "id": str(user.id),
        "phone": user.username,
        "nickname": nickname,
    }


def to_boundary(date_input: str | None, end: bool) -> datetime | None:
    if not date_input:
        return None
    value = f"{date_input}T{'23:59:59.999' if end else '00:00:00.000'}+00:00"
    return parse_iso(value)


def deterministic_stats(seed: str) -> dict[str, int]:
    total = sum((index + 1) * ord(ch) for index, ch in enumerate(seed))
    views = 100 + total % 1000
    up = 20 + total % 120
    comments = 3 + total % 80
    return {
        "views": views,
        "up": up,
        "comments": comments,
        "hot_score": views + up * 5 + comments * 3,
    }


def _summary_from_detail(detail: dict[str, Any], category_map: dict[str, str], tag_map: dict[str, str]) -> dict[str, Any]:
    content = detail.get("content", {})
    category_ids = content.get("category_ids") or ([content.get("category_id")] if content.get("category_id") else [])
    category_ids = [item for item in category_ids if item]
    tag_ids = content.get("tag_ids") or []

    primary_category = category_ids[0] if category_ids else None
    category = None
    if primary_category:
        category = {
            "id": primary_category,
            "name": category_map.get(primary_category, primary_category),
        }

    author_id = content.get("author_id", "user-001")

    return {
        "id": content.get("id"),
        "type": content.get("type"),
        "status": content.get("status", "Listed"),
        "title": content.get("title", ""),
        "one_liner": content.get("one_liner"),
        "category": category,
        "tags": [{"id": tag_id, "name": tag_map.get(tag_id, tag_id)} for tag_id in tag_ids],
        "author": {
            "id": author_id,
            "nickname": author_id,
            "avatar_asset_id": None,
        },
        "cover_asset_id": content.get("cover_asset_id"),
        "stats_7d": deterministic_stats(f"{content.get('type')}:{content.get('id') or ''}"),
        "created_at": content.get("created_at"),
        "updated_at": content.get("updated_at"),
        "highlight": {
            "title": None,
            "one_liner": None,
            "document": None,
        },
        "category_ids": category_ids,
        "category_id": primary_category,
        "tag_ids": tag_ids,
    }


def _summary_from_authoring(record: dict[str, Any]) -> dict[str, Any]:
    content = record.get("data", {}).get("content", {})
    category_ids = content.get("category_ids") or []
    return {
        "id": record.get("id"),
        "type": record.get("type"),
        "status": record.get("status", "Draft"),
        "title": content.get("title", ""),
        "one_liner": content.get("one_liner"),
        "category": None,
        "tags": [{"id": tag_id, "name": tag_id} for tag_id in content.get("tag_ids", [])],
        "author": {
            "id": content.get("author_id", "user-local"),
            "nickname": content.get("author_id", "user-local"),
            "avatar_asset_id": None,
        },
        "cover_asset_id": content.get("cover_asset_id"),
        "stats_7d": {
            "views": 0,
            "up": 0,
            "comments": 0,
            "hot_score": 0,
        },
        "created_at": content.get("created_at", record.get("created_at", now_iso())),
        "updated_at": content.get("updated_at", record.get("updated_at", now_iso())),
        "highlight": {
            "title": None,
            "one_liner": None,
            "document": None,
        },
        "category_ids": category_ids,
        "tag_ids": content.get("tag_ids", []),
    }


def _load_taxonomy_maps() -> tuple[dict[str, str], dict[str, str]]:
    categories = list(AdminCategory.objects.values("id", "name"))
    tags = list(AdminTag.objects.values("id", "name"))

    if categories or tags:
        category_map = {str(item["id"]): str(item["name"]) for item in categories}
        tag_map = {str(item["id"]): str(item["name"]) for item in tags}
        return category_map, tag_map

    # Backward-compatible fallback for legacy state payload.
    admin_state = load_state(ADMIN_KEY, {"categories": [], "tags": [], "events": []})
    category_map = {item["id"]: item.get("name", item["id"]) for item in admin_state.get("categories", [])}
    tag_map = {item["id"]: item.get("name", item["id"]) for item in admin_state.get("tags", [])}
    return category_map, tag_map


def _load_authoring_records() -> list[dict[str, Any]]:
    state = load_state(AUTHORING_KEY, {"records": []})
    records = state.get("records")
    if not isinstance(records, list):
        return []
    return records


def _save_authoring_records(records: list[dict[str, Any]]) -> None:
    save_state(AUTHORING_KEY, {"records": records})


def _find_authoring_index(records: list[dict[str, Any]], content_type: str, resource_id: str) -> int:
    for index, item in enumerate(records):
        if item.get("type") == content_type and item.get("id") == resource_id:
            return index
    return -1


def _get_record_detail(content_type: str, resource_id: str) -> dict[str, Any]:
    records = _load_authoring_records()
    for item in records:
        if item.get("type") == content_type and item.get("id") == resource_id:
            detail = item.get("data")
            if isinstance(detail, dict):
                return clone_json(detail)

    try:
        record = ContentRecord.objects.get(resource_id=resource_id, content_type=content_type)
    except ContentRecord.DoesNotExist as exc:
        raise Http404(f"Not found: {content_type}/{resource_id}") from exc

    return clone_json(record.detail)


def _append_audit_log(item: dict[str, Any]) -> None:
    state = load_state(AUDIT_KEY, {"logs": []})
    logs = state.get("logs") if isinstance(state.get("logs"), list) else []

    entry = {
        "id": item.get("id") or create_id("audit"),
        "at": item.get("at") or now_iso(),
        "actor": item.get("actor") or DEFAULT_ACTOR,
        "action": item.get("action"),
        "target_type": item.get("target_type"),
        "target_id": item.get("target_id"),
        "from_status": item.get("from_status"),
        "to_status": item.get("to_status"),
        "reason": item.get("reason"),
        "meta": item.get("meta"),
    }
    logs.insert(0, entry)
    save_state(AUDIT_KEY, {"logs": logs[:1000]})


def _list_audit_logs(params: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, int]]:
    state = load_state(AUDIT_KEY, {"logs": []})
    logs = state.get("logs") if isinstance(state.get("logs"), list) else []

    action_type = params.get("action_type")
    actor_user_id = params.get("actor_user_id")
    target_type = params.get("target_type")
    target_id = params.get("target_id")
    date_from = params.get("date_from")
    date_to = params.get("date_to")

    from_dt = to_boundary(date_from, end=False)
    to_dt = to_boundary(date_to, end=True)

    filtered: list[dict[str, Any]] = []
    for item in logs:
        if action_type and action_type != "all" and item.get("action") != action_type:
            continue
        if actor_user_id and actor_user_id != "all" and item.get("actor") != actor_user_id:
            continue
        if target_type and item.get("target_type") != target_type:
            continue
        if target_id and item.get("target_id") != target_id:
            continue

        at_dt = parse_iso(item.get("at"))
        if from_dt and at_dt and at_dt < from_dt:
            continue
        if to_dt and at_dt and at_dt > to_dt:
            continue
        filtered.append(item)

    offset = parse_int(params.get("offset"), 0)
    limit = parse_int(params.get("limit"), 20, minimum=1)

    return filtered[offset: offset + limit], {
        "offset": offset,
        "limit": limit,
        "total": len(filtered),
    }


def _load_admin_state() -> dict[str, Any]:
    return load_state(ADMIN_KEY, {"events": []})


def _save_admin_state(state: dict[str, Any]) -> None:
    save_state(ADMIN_KEY, state)


def _append_admin_event(state: dict[str, Any], event_type: str, target_type: str, summary: str, actor: str = DEFAULT_ACTOR, target_id: str | None = None, payload: dict[str, Any] | None = None) -> None:
    events = state.get("events") if isinstance(state.get("events"), list) else []
    events.insert(0, {
        "id": create_id("event"),
        "at": now_iso(),
        "actor": actor,
        "type": event_type,
        "target_type": target_type,
        "target_id": target_id,
        "summary": summary,
        "payload": payload,
    })
    state["events"] = events[:400]


def _filter_by_query(items: list[dict[str, Any]], q: str, fields: list[str]) -> list[dict[str, Any]]:
    keyword = q.strip().lower()
    if not keyword:
        return items
    result = []
    for item in items:
        haystack = " ".join(str(item.get(field, "")) for field in fields).lower()
        if keyword in haystack:
            result.append(item)
    return result


def _to_iso(value: datetime) -> str:
    return value.astimezone(dt_timezone.utc).isoformat().replace("+00:00", "Z")


def _serialize_category(item: AdminCategory) -> dict[str, Any]:
    return {
        "id": item.id,
        "name": item.name,
        "parent_id": item.parent_id,
        "description": item.description,
        "status": item.status,
        "usage_count": item.usage_count,
        "created_at": _to_iso(item.created_at),
        "updated_at": _to_iso(item.updated_at),
    }


def _serialize_tag(item: AdminTag) -> dict[str, Any]:
    return {
        "id": item.id,
        "name": item.name,
        "status": item.status,
        "usage_count": item.usage_count,
        "created_at": _to_iso(item.created_at),
        "updated_at": _to_iso(item.updated_at),
    }


class HealthApi(APIView):
    def get(self, request: Request) -> Response:  # noqa: ARG002
        ensure_seeded()
        return Response({"ok": True, "now": now_iso()})


class AuthSendCodeApi(APIView):
    def post(self, request: Request) -> Response:
        ensure_seeded()

        phone = ensure_phone(str(request.data.get("phone", "")))
        purpose = str(request.data.get("purpose", "login")).strip() or "login"
        if purpose not in {"login", "register"}:
            raise ValidationError({"detail": "purpose must be login/register"})

        # 预留短信通道，当前阶段返回固定验证码用于联调。
        return Response({
            "ok": True,
            "phone": phone,
            "purpose": purpose,
            "mock_code": MOCK_SMS_CODE,
            "expires_in_seconds": 300,
        })


class AuthLoginApi(APIView):
    def post(self, request: Request) -> Response:
        ensure_seeded()

        phone = ensure_phone(str(request.data.get("phone", "")))
        ensure_mock_code(str(request.data.get("code", "")))

        user = User.objects.filter(username=phone).first()
        if not user:
            return Response(
                {"code": "PHONE_NOT_REGISTERED", "detail": "手机号未注册，请先注册"},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.last_login = dj_timezone.now()
        user.save(update_fields=["last_login"])

        return Response({
            "token": uuid4().hex,
            "user": serialize_phone_user(user),
        })


class AuthRegisterApi(APIView):
    def post(self, request: Request) -> Response:
        ensure_seeded()

        nickname = str(request.data.get("nickname", "")).strip()
        if not nickname:
            raise ValidationError({"detail": "nickname is required"})

        phone = ensure_phone(str(request.data.get("phone", "")))
        ensure_mock_code(str(request.data.get("code", "")))

        if User.objects.filter(username=phone).exists():
            return Response(
                {"code": "PHONE_ALREADY_REGISTERED", "detail": "手机号已注册，请直接登录"},
                status=status.HTTP_409_CONFLICT,
            )

        user = User.objects.create(username=phone, first_name=nickname[:150], is_active=True)
        user.set_unusable_password()
        user.save(update_fields=["password"])

        return Response(
            {
                "token": uuid4().hex,
                "user": serialize_phone_user(user),
            },
            status=status.HTTP_201_CREATED,
        )


class ContentListApi(APIView):
    def get(self, request: Request) -> Response:
        ensure_seeded()

        content_type = request.query_params.get("type", "all")
        query = request.query_params.get("q", "").strip()
        offset = parse_int(request.query_params.get("offset"), 0)
        limit = parse_int(request.query_params.get("limit"), 20, minimum=1)

        tag_ids = request.query_params.getlist("tag_ids")
        if not tag_ids:
            raw = request.query_params.get("tag_ids", "")
            tag_ids = [item.strip() for item in raw.split(",") if item.strip()]

        queryset = ContentRecord.objects.all()
        if content_type != "all":
            ensure_content_type(content_type)
            queryset = queryset.filter(content_type=content_type)

        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(one_liner__icontains=query))

        category_map, tag_map = _load_taxonomy_maps()

        merged: dict[str, dict[str, Any]] = {}
        for item in queryset.order_by("-updated_at"):
            summary = _summary_from_detail(item.detail, category_map, tag_map)
            merged[f"{summary.get('type')}:{summary.get('id')}"] = summary

        for item in _load_authoring_records():
            summary = _summary_from_authoring(item)
            merged[f"{summary.get('type')}:{summary.get('id')}"] = summary

        all_items = list(merged.values())
        all_items.sort(key=lambda entry: str(entry.get("updated_at", "")), reverse=True)

        if tag_ids:
            all_items = [
                item
                for item in all_items
                if all(tag_id in (item.get("tag_ids") or []) for tag_id in tag_ids)
            ]

        paged = all_items[offset: offset + limit]
        return Response({
            "items": paged,
            "meta": {
                "offset": offset,
                "limit": limit,
                "total": len(all_items),
            },
        })


class ContentDetailApi(APIView):
    content_type: str = ""

    def get(self, request: Request, resource_id: str) -> Response:  # noqa: ARG002
        ensure_seeded()
        detail = _get_record_detail(self.content_type, resource_id)
        return Response(detail)


class PromptDetailApi(ContentDetailApi):
    content_type = "prompt"


class McpDetailApi(ContentDetailApi):
    content_type = "mcp"


class SkillDetailApi(ContentDetailApi):
    content_type = "skill"


class TutorialDetailApi(ContentDetailApi):
    content_type = "tutorial"


class AuthoringRecordsApi(APIView):
    def get(self, request: Request) -> Response:
        ensure_seeded()
        records = _load_authoring_records()
        content_type = request.query_params.get("type")
        if content_type:
            ensure_content_type(content_type)
            records = [item for item in records if item.get("type") == content_type]
        records.sort(key=lambda item: str(item.get("updated_at", "")), reverse=True)
        return Response({"items": records})

    def post(self, request: Request) -> Response:
        ensure_seeded()

        content_type = ensure_content_type(str(request.data.get("type", "")).strip())
        data = request.data.get("data")
        if not isinstance(data, dict):
            raise ValidationError("data must be an object")

        content = data.get("content")
        if not isinstance(content, dict):
            raise ValidationError("data.content must be an object")

        resource_id = str(content.get("id") or f"{content_type}-local-{uuid4().hex[:12]}")
        timestamp = now_iso()

        content["id"] = resource_id
        content["type"] = content_type
        content["status"] = "Draft"
        content["created_at"] = content.get("created_at") or timestamp
        content["updated_at"] = timestamp
        data["content"] = content

        records = _load_authoring_records()
        record = {
            "id": resource_id,
            "type": content_type,
            "status": "Draft",
            "data": data,
            "created_at": timestamp,
            "updated_at": timestamp,
            "version": 1,
        }

        index = _find_authoring_index(records, content_type, resource_id)
        if index >= 0:
            records.pop(index)
        records.insert(0, record)
        _save_authoring_records(records)

        return Response({"id": resource_id}, status=status.HTTP_201_CREATED)


class AuthoringRecordApi(APIView):
    def get(self, request: Request, content_type: str, resource_id: str) -> Response:  # noqa: ARG002
        ensure_seeded()
        ensure_content_type(content_type)
        records = _load_authoring_records()
        index = _find_authoring_index(records, content_type, resource_id)
        if index < 0:
            return Response({"item": None})
        return Response({"item": records[index]})

    def patch(self, request: Request, content_type: str, resource_id: str) -> Response:
        ensure_seeded()
        ensure_content_type(content_type)

        mode = str(request.data.get("mode") or "draft")
        patch = request.data.get("patch")
        if not isinstance(patch, dict):
            raise ValidationError("patch must be an object")

        records = _load_authoring_records()
        index = _find_authoring_index(records, content_type, resource_id)
        if index < 0:
            raise Http404(f"Record not found: {content_type}/{resource_id}")

        current = records[index]
        status_now = current.get("status")
        if mode == "after_submit" and status_now not in {"PendingReview", "Listed", "Reject"}:
            raise ValidationError(f"Status {status_now} is not editable after submit")

        next_status = "PendingReview" if mode == "after_submit" else "Draft"
        current_data = current.get("data") if isinstance(current.get("data"), dict) else {}
        next_data = clone_json(current_data)

        for key, value in patch.items():
            if key != "content":
                next_data[key] = value

        incoming_content = patch.get("content") if isinstance(patch.get("content"), dict) else {}
        base_content = next_data.get("content") if isinstance(next_data.get("content"), dict) else {}

        merged_content = {**base_content, **incoming_content}
        merged_content["id"] = resource_id
        merged_content["type"] = content_type
        merged_content["status"] = next_status
        merged_content["updated_at"] = now_iso()
        next_data["content"] = merged_content

        current["status"] = next_status
        current["data"] = next_data
        current["updated_at"] = now_iso()
        current["version"] = int(current.get("version") or 0) + 1
        records[index] = current
        _save_authoring_records(records)

        return Response({"ok": True})

    def delete(self, request: Request, content_type: str, resource_id: str) -> Response:  # noqa: ARG002
        ensure_seeded()
        ensure_content_type(content_type)

        records = _load_authoring_records()
        index = _find_authoring_index(records, content_type, resource_id)
        if index < 0:
            raise Http404(f"Record not found: {content_type}/{resource_id}")

        records.pop(index)
        _save_authoring_records(records)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AuthoringSubmitApi(APIView):
    def post(self, request: Request, content_type: str, resource_id: str) -> Response:  # noqa: ARG002
        ensure_seeded()
        ensure_content_type(content_type)

        records = _load_authoring_records()
        index = _find_authoring_index(records, content_type, resource_id)
        if index < 0:
            raise Http404(f"Record not found: {content_type}/{resource_id}")

        current = records[index]
        current["status"] = "PendingReview"
        data = current.get("data") if isinstance(current.get("data"), dict) else {}
        content = data.get("content") if isinstance(data.get("content"), dict) else {}
        content["status"] = "PendingReview"
        content["updated_at"] = now_iso()
        data["content"] = content
        current["data"] = data
        current["updated_at"] = now_iso()
        current["version"] = int(current.get("version") or 0) + 1
        records[index] = current
        _save_authoring_records(records)

        return Response({"ok": True})


class AuthoringStatusApi(APIView):
    def post(self, request: Request, content_type: str, resource_id: str) -> Response:
        ensure_seeded()
        ensure_content_type(content_type)
        next_status = ensure_status(str(request.data.get("next_status", "")).strip())

        records = _load_authoring_records()
        index = _find_authoring_index(records, content_type, resource_id)
        if index < 0:
            raise Http404(f"Record not found: {content_type}/{resource_id}")

        current = records[index]
        current["status"] = next_status

        data = current.get("data") if isinstance(current.get("data"), dict) else {}
        content = data.get("content") if isinstance(data.get("content"), dict) else {}
        content["status"] = next_status
        content["updated_at"] = now_iso()
        data["content"] = content
        current["data"] = data
        current["updated_at"] = now_iso()
        current["version"] = int(current.get("version") or 0) + 1
        records[index] = current
        _save_authoring_records(records)

        return Response({"ok": True})


class SocialVoteApi(APIView):
    def get(self, request: Request) -> Response:
        ensure_seeded()

        target_type = ensure_content_type(str(request.query_params.get("target_type", "")).strip())
        target_id = str(request.query_params.get("target_id", "")).strip()
        key = make_target_key(target_type, target_id)

        state = load_state(SOCIAL_KEY, {"favorites": {}, "votes": {}, "comments": {}})
        votes = state.get("votes") if isinstance(state.get("votes"), dict) else {}

        value = votes.get(key)
        return Response({"value": value, "upvote_count": 1 if value == "up" else 0})


class SocialVoteToggleApi(APIView):
    def post(self, request: Request) -> Response:
        ensure_seeded()

        target_type = ensure_content_type(str(request.data.get("target_type", "")).strip())
        target_id = str(request.data.get("target_id", "")).strip()
        value = str(request.data.get("value", "")).strip()
        if value not in {"up", "down"}:
            raise ValidationError("value must be 'up' or 'down'")

        key = make_target_key(target_type, target_id)
        state = load_state(SOCIAL_KEY, {"favorites": {}, "votes": {}, "comments": {}})
        votes = state.get("votes") if isinstance(state.get("votes"), dict) else {}

        current = votes.get(key)
        votes[key] = None if current == value else value
        state["votes"] = votes
        save_state(SOCIAL_KEY, state)

        return Response({"value": votes.get(key)})


class SocialFavoriteApi(APIView):
    def get(self, request: Request) -> Response:
        ensure_seeded()

        target_type = ensure_content_type(str(request.query_params.get("target_type", "")).strip())
        target_id = str(request.query_params.get("target_id", "")).strip()
        key = make_target_key(target_type, target_id)

        state = load_state(SOCIAL_KEY, {"favorites": {}, "votes": {}, "comments": {}})
        favorites = state.get("favorites") if isinstance(state.get("favorites"), dict) else {}

        favorited = bool(favorites.get(key))
        return Response({"favorited": favorited, "count": 1 if favorited else 0})


class SocialFavoriteToggleApi(APIView):
    def post(self, request: Request) -> Response:
        ensure_seeded()

        target_type = ensure_content_type(str(request.data.get("target_type", "")).strip())
        target_id = str(request.data.get("target_id", "")).strip()
        key = make_target_key(target_type, target_id)

        state = load_state(SOCIAL_KEY, {"favorites": {}, "votes": {}, "comments": {}})
        favorites = state.get("favorites") if isinstance(state.get("favorites"), dict) else {}

        next_value = not bool(favorites.get(key))
        if next_value:
            favorites[key] = True
        else:
            favorites.pop(key, None)

        state["favorites"] = favorites
        save_state(SOCIAL_KEY, state)
        return Response({"favorited": next_value})


class SocialFavoritesApi(APIView):
    def get(self, request: Request) -> Response:  # noqa: ARG002
        ensure_seeded()

        state = load_state(SOCIAL_KEY, {"favorites": {}, "votes": {}, "comments": {}})
        favorites = state.get("favorites") if isinstance(state.get("favorites"), dict) else {}

        items = []
        for key, enabled in favorites.items():
            if not enabled:
                continue
            parts = str(key).split(":")
            if len(parts) < 2:
                continue
            target_type = parts[0]
            target_id = ":".join(parts[1:])
            if target_type in ALLOWED_TYPES and target_id:
                items.append({"target_type": target_type, "target_id": target_id})

        return Response({"items": items})


class SocialCommentsApi(APIView):
    def get(self, request: Request) -> Response:
        ensure_seeded()

        target_type = ensure_content_type(str(request.query_params.get("target_type", "")).strip())
        target_id = str(request.query_params.get("target_id", "")).strip()
        key = make_target_key(target_type, target_id)

        state = load_state(SOCIAL_KEY, {"favorites": {}, "votes": {}, "comments": {}})
        comments = state.get("comments") if isinstance(state.get("comments"), dict) else {}
        result = comments.get(key) if isinstance(comments.get(key), list) else []

        return Response({"items": result})

    def post(self, request: Request) -> Response:
        ensure_seeded()

        target_type = ensure_content_type(str(request.data.get("target_type", "")).strip())
        target_id = str(request.data.get("target_id", "")).strip()
        content = str(request.data.get("content", "")).strip()
        if not content:
            raise ValidationError("content is required")

        key = make_target_key(target_type, target_id)
        state = load_state(SOCIAL_KEY, {"favorites": {}, "votes": {}, "comments": {}})
        comments = state.get("comments") if isinstance(state.get("comments"), dict) else {}

        item = {
            "id": create_id("cmt"),
            "target_type": target_type,
            "target_id": target_id,
            "content": content,
            "created_at": now_iso(),
        }

        existing = comments.get(key) if isinstance(comments.get(key), list) else []
        comments[key] = [item, *existing]
        state["comments"] = comments
        save_state(SOCIAL_KEY, state)

        return Response(item, status=status.HTTP_201_CREATED)


class SocialCommentDeleteApi(APIView):
    def delete(self, request: Request, comment_id: str) -> Response:
        ensure_seeded()

        target_type = ensure_content_type(str(request.query_params.get("target_type", "")).strip())
        target_id = str(request.query_params.get("target_id", "")).strip()
        key = make_target_key(target_type, target_id)

        state = load_state(SOCIAL_KEY, {"favorites": {}, "votes": {}, "comments": {}})
        comments = state.get("comments") if isinstance(state.get("comments"), dict) else {}
        existing = comments.get(key) if isinstance(comments.get(key), list) else []
        comments[key] = [item for item in existing if item.get("id") != comment_id]
        state["comments"] = comments
        save_state(SOCIAL_KEY, state)

        return Response(status=status.HTTP_204_NO_CONTENT)


class AuditLogsApi(APIView):
    def get(self, request: Request) -> Response:
        ensure_seeded()
        items, meta = _list_audit_logs(dict(request.query_params.items()))
        return Response({"items": items, "meta": meta})

    def post(self, request: Request) -> Response:
        ensure_seeded()

        data = request.data
        action = str(data.get("action", "")).strip()
        target_type = ensure_content_type(str(data.get("target_type", "")).strip())
        target_id = str(data.get("target_id", "")).strip()

        if not action or not target_id:
            raise ValidationError("action and target_id are required")

        _append_audit_log({
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "from_status": data.get("from_status"),
            "to_status": data.get("to_status"),
            "reason": data.get("reason"),
            "actor": data.get("actor"),
            "meta": data.get("meta"),
        })

        return Response({"ok": True}, status=status.HTTP_201_CREATED)


class AdminReviewQueueApi(APIView):
    def get(self, request: Request) -> Response:
        ensure_seeded()

        status_filter = request.query_params.get("status")
        type_filter = request.query_params.get("type", "all")
        query = request.query_params.get("q", "").strip().lower()
        offset = parse_int(request.query_params.get("offset"), 0)
        limit = parse_int(request.query_params.get("limit"), 20, minimum=1)

        records = _load_authoring_records()
        filtered = []
        for item in records:
            if status_filter and item.get("status") != status_filter:
                continue
            if type_filter != "all" and item.get("type") != type_filter:
                continue
            title = str(item.get("data", {}).get("content", {}).get("title", "")).lower()
            one_liner = str(item.get("data", {}).get("content", {}).get("one_liner", "")).lower()
            if query and query not in f"{title} {one_liner}":
                continue
            filtered.append(_summary_from_authoring(item))

        filtered.sort(key=lambda item: str(item.get("updated_at", "")), reverse=True)
        paged = filtered[offset: offset + limit]

        return Response({
            "items": paged,
            "meta": {
                "offset": offset,
                "limit": limit,
                "total": len(filtered),
            },
        })


class AdminReviewItemApi(APIView):
    def get(self, request: Request, content_type: str, resource_id: str) -> Response:  # noqa: ARG002
        ensure_seeded()
        ensure_content_type(content_type)

        detail = _get_record_detail(content_type, resource_id)
        logs, _ = _list_audit_logs({
            "target_type": content_type,
            "target_id": resource_id,
            "offset": "0",
            "limit": "100",
        })

        return Response({
            "detailVM": detail,
            "auditLogs": logs,
        })


class AdminReviewActionApi(APIView):
    action_name: str = ""

    def post(self, request: Request, content_type: str, resource_id: str) -> Response:
        ensure_seeded()
        ensure_content_type(content_type)

        records = _load_authoring_records()
        index = _find_authoring_index(records, content_type, resource_id)
        if index < 0:
            raise Http404(f"Record not found: {content_type}/{resource_id}")

        current = records[index]
        from_status = str(current.get("status", "Draft"))

        reason = str(request.data.get("reason", "")).strip()
        also_list = bool(request.data.get("also_list", False))

        if self.action_name in {"reject", "unlist", "rollback"} and not reason:
            raise ValidationError(f"{self.action_name} reason is required")

        to_status = from_status
        if self.action_name == "approve":
            to_status = "Approved"
        elif self.action_name == "reject":
            to_status = "Reject"
        elif self.action_name == "list":
            to_status = "Listed"
        elif self.action_name == "unlist":
            to_status = "Unlisted"

        if self.action_name in {"approve", "reject", "list", "unlist"}:
            current["status"] = to_status
            data = current.get("data") if isinstance(current.get("data"), dict) else {}
            content = data.get("content") if isinstance(data.get("content"), dict) else {}
            content["status"] = to_status
            content["updated_at"] = now_iso()
            data["content"] = content
            current["data"] = data
            current["updated_at"] = now_iso()
            current["version"] = int(current.get("version") or 0) + 1
            records[index] = current
            _save_authoring_records(records)

        _append_audit_log({
            "action": self.action_name,
            "target_type": content_type,
            "target_id": resource_id,
            "from_status": from_status,
            "to_status": to_status,
            "reason": reason or None,
            "meta": {
                "also_list": also_list if self.action_name == "approve" else None,
                "to_version": request.data.get("to_version"),
            },
        })

        if self.action_name == "approve" and also_list:
            current = records[index]
            current["status"] = "Listed"
            data = current.get("data") if isinstance(current.get("data"), dict) else {}
            content = data.get("content") if isinstance(data.get("content"), dict) else {}
            content["status"] = "Listed"
            content["updated_at"] = now_iso()
            data["content"] = content
            current["data"] = data
            current["updated_at"] = now_iso()
            current["version"] = int(current.get("version") or 0) + 1
            records[index] = current
            _save_authoring_records(records)
            _append_audit_log({
                "action": "list",
                "target_type": content_type,
                "target_id": resource_id,
                "from_status": "Approved",
                "to_status": "Listed",
                "reason": reason or None,
                "meta": {"via": "approve_also_list"},
            })

        return Response({"ok": True})


class AdminReviewApproveApi(AdminReviewActionApi):
    action_name = "approve"


class AdminReviewRejectApi(AdminReviewActionApi):
    action_name = "reject"


class AdminReviewListApi(AdminReviewActionApi):
    action_name = "list"


class AdminReviewUnlistApi(AdminReviewActionApi):
    action_name = "unlist"


class AdminReviewRollbackApi(AdminReviewActionApi):
    action_name = "rollback"


class AdminCategoriesApi(APIView):
    def get(self, request: Request) -> Response:
        ensure_seeded()
        q = request.query_params.get("q", "")
        status_filter = request.query_params.get("status", "all")

        queryset = AdminCategory.objects.all()
        if status_filter != "all":
            queryset = queryset.filter(status=status_filter)
        if q.strip():
            queryset = queryset.filter(
                Q(id__icontains=q.strip()) | Q(name__icontains=q.strip()) | Q(description__icontains=q.strip())
            )

        items = [_serialize_category(item) for item in queryset.order_by("-updated_at")]
        return Response({"items": items})

    def post(self, request: Request) -> Response:
        ensure_seeded()
        state = _load_admin_state()

        category_id = str(request.data.get("id", "")).strip() or None
        name = str(request.data.get("name", "")).strip()
        if not name:
            raise ValidationError("name is required")

        description = str(request.data.get("description", "")).strip()
        parent_raw = request.data.get("parent_id")
        parent_id = str(parent_raw).strip() if parent_raw is not None else None
        if parent_id == "":
            parent_id = None
        actor = str(request.data.get("actor") or DEFAULT_ACTOR)
        timestamp = dj_timezone.now().astimezone(dt_timezone.utc)

        current = AdminCategory.objects.filter(id=category_id).first() if category_id else None
        if current:
            current.name = name
            current.description = description or current.description
            current.parent_id = parent_id
            current.updated_at = timestamp
            current.save(update_fields=["name", "description", "parent_id", "updated_at"])
            _append_admin_event(state, "taxonomy.update", "category", f"更新分类 {name}", actor=actor, target_id=current.id)
            _save_admin_state(state)
            return Response(_serialize_category(current))

        existing_ids = set(AdminCategory.objects.values_list("id", flat=True))
        base_id = f"cat-{slugify(name)}" if slugify(name) else create_id("cat")
        next_id = base_id
        serial = 2
        while next_id in existing_ids:
            next_id = f"{base_id}-{serial}"
            serial += 1

        created = AdminCategory.objects.create(
            id=next_id,
            name=name,
            parent_id=parent_id,
            description=description,
            status="active",
            usage_count=0,
            created_at=timestamp,
            updated_at=timestamp,
        )
        _append_admin_event(state, "taxonomy.create", "category", f"新增分类 {name}", actor=actor, target_id=next_id)
        _save_admin_state(state)
        return Response(_serialize_category(created), status=status.HTTP_201_CREATED)


class AdminCategoryStatusApi(APIView):
    def post(self, request: Request, category_id: str) -> Response:
        ensure_seeded()
        state = _load_admin_state()
        status_value = str(request.data.get("status", "")).strip()
        if status_value not in {"active", "inactive"}:
            raise ValidationError("status must be active/inactive")
        actor = str(request.data.get("actor") or DEFAULT_ACTOR)

        item = AdminCategory.objects.filter(id=category_id).first()
        if not item:
            raise Http404(f"Category not found: {category_id}")

        if item.status != status_value:
            from_status = item.status
            item.status = status_value
            item.updated_at = dj_timezone.now().astimezone(dt_timezone.utc)
            item.save(update_fields=["status", "updated_at"])
            _append_admin_event(
                state,
                "taxonomy.toggle",
                "category",
                f"{'启用' if status_value == 'active' else '停用'}分类 {item.name}",
                actor=actor,
                target_id=category_id,
                payload={"from_status": from_status, "to_status": status_value},
            )
            _save_admin_state(state)

        return Response({"ok": True})


class AdminTagsApi(APIView):
    def get(self, request: Request) -> Response:
        ensure_seeded()
        q = request.query_params.get("q", "")
        status_filter = request.query_params.get("status", "all")

        queryset = AdminTag.objects.all()
        if status_filter != "all":
            queryset = queryset.filter(status=status_filter)
        if q.strip():
            queryset = queryset.filter(Q(id__icontains=q.strip()) | Q(name__icontains=q.strip()))

        items = [_serialize_tag(item) for item in queryset.order_by("-updated_at")]
        return Response({"items": items})

    def post(self, request: Request) -> Response:
        ensure_seeded()
        state = _load_admin_state()

        tag_id = str(request.data.get("id", "")).strip() or None
        name = str(request.data.get("name", "")).strip()
        if not name:
            raise ValidationError("name is required")
        actor = str(request.data.get("actor") or DEFAULT_ACTOR)
        timestamp = dj_timezone.now().astimezone(dt_timezone.utc)

        current = AdminTag.objects.filter(id=tag_id).first() if tag_id else None
        if current:
            current.name = name
            current.updated_at = timestamp
            current.save(update_fields=["name", "updated_at"])
            _append_admin_event(state, "taxonomy.update", "tag", f"更新标签 {name}", actor=actor, target_id=current.id)
            _save_admin_state(state)
            return Response(_serialize_tag(current))

        existing_ids = set(AdminTag.objects.values_list("id", flat=True))
        base_id = f"tag-{slugify(name)}" if slugify(name) else create_id("tag")
        next_id = base_id
        serial = 2
        while next_id in existing_ids:
            next_id = f"{base_id}-{serial}"
            serial += 1

        created = AdminTag.objects.create(
            id=next_id,
            name=name,
            status="active",
            usage_count=0,
            created_at=timestamp,
            updated_at=timestamp,
        )
        _append_admin_event(state, "taxonomy.create", "tag", f"新增标签 {name}", actor=actor, target_id=next_id)
        _save_admin_state(state)
        return Response(_serialize_tag(created), status=status.HTTP_201_CREATED)


class AdminTagStatusApi(APIView):
    def post(self, request: Request, tag_id: str) -> Response:
        ensure_seeded()
        state = _load_admin_state()
        status_value = str(request.data.get("status", "")).strip()
        if status_value not in {"active", "inactive"}:
            raise ValidationError("status must be active/inactive")
        actor = str(request.data.get("actor") or DEFAULT_ACTOR)

        item = AdminTag.objects.filter(id=tag_id).first()
        if not item:
            raise Http404(f"Tag not found: {tag_id}")

        if item.status != status_value:
            from_status = item.status
            item.status = status_value
            item.updated_at = dj_timezone.now().astimezone(dt_timezone.utc)
            item.save(update_fields=["status", "updated_at"])
            _append_admin_event(
                state,
                "taxonomy.toggle",
                "tag",
                f"{'启用' if status_value == 'active' else '停用'}标签 {item.name}",
                actor=actor,
                target_id=tag_id,
                payload={"from_status": from_status, "to_status": status_value},
            )
            _save_admin_state(state)

        return Response({"ok": True})


class AdminEventsApi(APIView):
    def get(self, request: Request) -> Response:
        ensure_seeded()
        state = _load_admin_state()
        events = state.get("events") if isinstance(state.get("events"), list) else []

        q = request.query_params.get("q", "").strip().lower()
        event_type = request.query_params.get("type", "all")
        actor = request.query_params.get("actor", "all")
        date_from = to_boundary(request.query_params.get("date_from"), end=False)
        date_to = to_boundary(request.query_params.get("date_to"), end=True)
        offset = parse_int(request.query_params.get("offset"), 0)
        limit = parse_int(request.query_params.get("limit"), 20, minimum=1)

        filtered = []
        for item in events:
            if event_type != "all" and item.get("type") != event_type:
                continue
            if actor != "all" and item.get("actor") != actor:
                continue

            if q:
                haystack = f"{item.get('summary', '')} {item.get('target_id', '')} {item.get('payload', '')}".lower()
                if q not in haystack:
                    continue

            at_dt = parse_iso(str(item.get("at", "")))
            if date_from and at_dt and at_dt < date_from:
                continue
            if date_to and at_dt and at_dt > date_to:
                continue

            filtered.append(item)

        filtered.sort(key=lambda item: str(item.get("at", "")), reverse=True)
        paged = filtered[offset: offset + limit]

        return Response({
            "items": paged,
            "meta": {
                "offset": offset,
                "limit": limit,
                "total": len(filtered),
            },
        })


class AdminEventActorsApi(APIView):
    def get(self, request: Request) -> Response:  # noqa: ARG002
        ensure_seeded()
        state = _load_admin_state()
        events = state.get("events") if isinstance(state.get("events"), list) else []
        actors = sorted({str(item.get("actor")) for item in events if item.get("actor")})
        return Response({"items": actors})
