from __future__ import annotations

import html
import json
import re

from django import forms
from django.contrib import admin
from django.conf import settings
from django.utils import timezone
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from api.models import AdminCategory, AdminTag, ContentRecord, StateDocument

CONTENT_TYPE_LABEL_MAP = {
    "prompt": "提示词",
    "mcp": "MCP",
    "skill": "技能",
    "tutorial": "教程",
}

CONTENT_STATUS_LABEL_MAP = {
    "Draft": "草稿",
    "PendingReview": "待审核",
    "Reject": "已驳回",
    "Approved": "已通过",
    "Listed": "已上架",
    "Unlisted": "已下架",
    "Deleted": "已删除",
}


def _taxonomy_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9\u4e00-\u9fa5]+", "-", value.strip().lower()).strip("-")
    return slug[:48] if slug else "item"


def _dedupe_keep_order(values: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


class ContentRecordAdminForm(forms.ModelForm):
    category_ids_selected = forms.MultipleChoiceField(
        label="分类选择",
        required=False,
        widget=admin.widgets.FilteredSelectMultiple("分类", is_stacked=False),
        help_text="选择已有分类（按 Ctrl/Cmd 可多选）。",
    )
    category_ids_new = forms.CharField(
        label="新增分类（按名称）",
        required=False,
        widget=forms.Textarea(attrs={"rows": 2, "placeholder": "输入分类名称，支持逗号/分号/换行分隔"}),
        help_text="新增项会自动生成 ID 并写入分类表，然后绑定到当前内容。",
    )
    tag_ids_selected = forms.MultipleChoiceField(
        label="标签选择",
        required=False,
        widget=admin.widgets.FilteredSelectMultiple("标签", is_stacked=False),
        help_text="选择已有标签（按 Ctrl/Cmd 可多选）。",
    )
    tag_ids_new = forms.CharField(
        label="新增标签（按名称）",
        required=False,
        widget=forms.Textarea(attrs={"rows": 2, "placeholder": "输入标签名称，支持逗号/分号/换行分隔"}),
        help_text="新增项会自动生成 ID 并写入标签表，然后绑定到当前内容。",
    )

    class Meta:
        model = ContentRecord
        fields = "__all__"
        labels = {
            "resource_id": "资源 ID",
            "content_type": "资源类型",
            "status": "状态",
            "title": "标题",
            "one_liner": "一句话描述",
            "category_ids": "分类 ID 列表（隐藏）",
            "tag_ids": "标签 ID 列表（隐藏）",
            "author_id": "作者 ID",
            "cover_asset_id": "封面资源 ID",
            "created_at": "创建时间",
            "updated_at": "更新时间",
            "detail": "Detail 原始 JSON",
        }
        widgets = {
            "category_ids": forms.HiddenInput(),
            "tag_ids": forms.HiddenInput(),
            "detail": forms.Textarea(
                attrs={
                    "rows": 26,
                    "style": "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;",
                }
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        current_category_ids = [str(item) for item in (self.instance.category_ids or []) if item]
        current_tag_ids = [str(item) for item in (self.instance.tag_ids or []) if item]

        self.fields["category_ids_selected"].choices = self._build_category_choices(current_category_ids)
        self.fields["tag_ids_selected"].choices = self._build_tag_choices(current_tag_ids)

        self.initial["category_ids_selected"] = current_category_ids
        self.initial["tag_ids_selected"] = current_tag_ids

    @staticmethod
    def _split_new_names(raw: str) -> list[str]:
        if not raw.strip():
            return []
        parts = re.split(r"[\n,，;；]+", raw)
        return [part.strip() for part in parts if part.strip()]

    @staticmethod
    def _build_category_choices(current_ids: list[str]) -> list[tuple[str, str]]:
        choices = [(item.id, f"{item.name} ({item.id})") for item in AdminCategory.objects.order_by("name", "id")]
        known_ids = {value for value, _ in choices}
        missing = [(item_id, f"[未收录] {item_id}") for item_id in current_ids if item_id not in known_ids]
        return [*choices, *missing]

    @staticmethod
    def _build_tag_choices(current_ids: list[str]) -> list[tuple[str, str]]:
        choices = [(item.id, f"{item.name} ({item.id})") for item in AdminTag.objects.order_by("name", "id")]
        known_ids = {value for value, _ in choices}
        missing = [(item_id, f"[未收录] {item_id}") for item_id in current_ids if item_id not in known_ids]
        return [*choices, *missing]

    @staticmethod
    def _get_or_create_category_id(name: str) -> str:
        existing = AdminCategory.objects.filter(name=name).first()
        if existing:
            return existing.id

        base_id = f"cat-{_taxonomy_slug(name)}"
        candidate = base_id
        serial = 2
        while AdminCategory.objects.filter(id=candidate).exists():
            candidate = f"{base_id}-{serial}"
            serial += 1

        now = timezone.now()
        AdminCategory.objects.create(
            id=candidate,
            name=name,
            parent_id=None,
            description="在内容编辑页按名称新增",
            status="active",
            usage_count=0,
            created_at=now,
            updated_at=now,
        )
        return candidate

    @staticmethod
    def _get_or_create_tag_id(name: str) -> str:
        existing = AdminTag.objects.filter(name=name).first()
        if existing:
            return existing.id

        base_id = f"tag-{_taxonomy_slug(name)}"
        candidate = base_id
        serial = 2
        while AdminTag.objects.filter(id=candidate).exists():
            candidate = f"{base_id}-{serial}"
            serial += 1

        now = timezone.now()
        AdminTag.objects.create(
            id=candidate,
            name=name,
            status="active",
            usage_count=0,
            created_at=now,
            updated_at=now,
        )
        return candidate

    def save(self, commit=True):
        instance = super().save(commit=False)

        selected_category_ids = [str(item) for item in self.cleaned_data.get("category_ids_selected", []) if item]
        selected_tag_ids = [str(item) for item in self.cleaned_data.get("tag_ids_selected", []) if item]

        new_category_ids = [
            self._get_or_create_category_id(name) for name in self._split_new_names(self.cleaned_data.get("category_ids_new", ""))
        ]
        new_tag_ids = [
            self._get_or_create_tag_id(name) for name in self._split_new_names(self.cleaned_data.get("tag_ids_new", ""))
        ]

        instance.category_ids = _dedupe_keep_order([*selected_category_ids, *new_category_ids])
        instance.tag_ids = _dedupe_keep_order([*selected_tag_ids, *new_tag_ids])

        if commit:
            instance.save()
            self.save_m2m()
        return instance


class StateDocumentAdminForm(forms.ModelForm):
    class Meta:
        model = StateDocument
        fields = "__all__"
        labels = {
            "key": "文档 Key",
            "payload": "Payload 原始 JSON",
            "updated_at": "更新时间",
        }
        widgets = {
            "payload": forms.Textarea(
                attrs={
                    "rows": 28,
                    "style": "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;",
                }
            ),
        }


class AdminCategoryForm(forms.ModelForm):
    class Meta:
        model = AdminCategory
        fields = "__all__"
        labels = {
            "id": "分类 ID",
            "name": "分类名称",
            "parent_id": "父级分类 ID",
            "description": "分类描述",
            "status": "状态",
            "usage_count": "使用次数",
            "created_at": "创建时间",
            "updated_at": "更新时间",
        }


class AdminTagForm(forms.ModelForm):
    class Meta:
        model = AdminTag
        fields = "__all__"
        labels = {
            "id": "标签 ID",
            "name": "标签名称",
            "status": "状态",
            "usage_count": "使用次数",
            "created_at": "创建时间",
            "updated_at": "更新时间",
        }


def _render_pretty_json(value: object) -> str:
    pretty = json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True)
    escaped = html.escape(pretty, quote=False)
    return format_html(
        '<pre style="margin:0; max-height:560px; overflow:auto; white-space:pre; '
        'font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; '
        'background:#0f172a; color:#e2e8f0; padding:12px; border-radius:8px;">{}</pre>',
        mark_safe(escaped),
    )


@admin.register(ContentRecord)
class ContentRecordAdmin(admin.ModelAdmin):
    form = ContentRecordAdminForm
    list_display = ("resource_id_display", "content_type_display", "status_display", "title", "updated_at_display")
    list_filter = ("content_type", "status", "updated_at")
    search_fields = ("resource_id", "title", "one_liner", "author_id")
    fieldsets = (
        ("基础信息", {"fields": ("resource_id", "title", "one_liner", "content_type", "status", "author_id")}),
        (
            "分类与标签",
            {
                "fields": ("category_ids_selected", "category_ids_new", "tag_ids_selected", "tag_ids_new"),
                "description": "优先通过选择器维护，新增请直接输入名称，无需手工填写 ID。",
            },
        ),
        ("资源与时间", {"fields": ("cover_asset_id", "created_at", "updated_at")}),
        ("Detail 结构化预览（只读）", {"fields": ("detail_pretty",)}),
        ("Detail 原始 JSON（可编辑）", {"fields": ("detail",), "classes": ("collapse",)}),
    )
    readonly_fields = ("detail_pretty",)

    @admin.display(description="资源 ID", ordering="resource_id")
    def resource_id_display(self, obj: ContentRecord) -> str:
        return obj.resource_id

    @admin.display(description="资源类型", ordering="content_type")
    def content_type_display(self, obj: ContentRecord) -> str:
        return CONTENT_TYPE_LABEL_MAP.get(obj.content_type, obj.content_type)

    @admin.display(description="状态", ordering="status")
    def status_display(self, obj: ContentRecord) -> str:
        return CONTENT_STATUS_LABEL_MAP.get(obj.status, obj.status)

    @admin.display(description="更新时间", ordering="updated_at")
    def updated_at_display(self, obj: ContentRecord):
        return obj.updated_at

    @admin.display(description="Detail 结构化预览")
    def detail_pretty(self, obj: ContentRecord) -> str:
        if not obj or obj.detail is None:
            return "-"
        return _render_pretty_json(obj.detail)

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if "detail_pretty" not in readonly:
            readonly.append("detail_pretty")
        if obj and "resource_id" not in readonly:
            readonly.append("resource_id")
        return tuple(readonly)


@admin.register(StateDocument)
class StateDocumentAdmin(admin.ModelAdmin):
    form = StateDocumentAdminForm
    list_display = ("key", "updated_at")
    search_fields = ("key",)
    fieldsets = (
        ("基础信息", {"fields": ("key", "updated_at")}),
        ("Payload 结构化预览（只读）", {"fields": ("payload_pretty",)}),
        ("Payload 原始 JSON（可编辑）", {"fields": ("payload",), "classes": ("collapse",)}),
    )
    readonly_fields = ("updated_at", "payload_pretty")

    @admin.display(description="Payload 结构化预览")
    def payload_pretty(self, obj: StateDocument) -> str:
        if not obj or obj.payload is None:
            return "-"
        return _render_pretty_json(obj.payload)

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if "updated_at" not in readonly:
            readonly.append("updated_at")
        if "payload_pretty" not in readonly:
            readonly.append("payload_pretty")
        if obj and "key" not in readonly:
            readonly.append("key")
        return tuple(readonly)


@admin.register(AdminCategory)
class AdminCategoryAdmin(admin.ModelAdmin):
    form = AdminCategoryForm
    list_display = ("id", "name", "status", "usage_count", "updated_at")
    list_filter = ("status", "updated_at")
    search_fields = ("id", "name", "description", "parent_id")
    fieldsets = (
        ("基础信息", {"fields": ("id", "name", "status", "usage_count")}),
        ("层级与描述", {"fields": ("parent_id", "description")}),
        ("时间", {"fields": ("created_at", "updated_at")}),
    )

    def get_readonly_fields(self, request, obj=None):
        readonly = ["created_at", "updated_at"]
        if obj:
            readonly.append("id")
        return tuple(readonly)

    def save_model(self, request, obj, form, change):
        now = timezone.now()
        if not obj.created_at:
            obj.created_at = now
        obj.updated_at = now
        super().save_model(request, obj, form, change)


@admin.register(AdminTag)
class AdminTagAdmin(admin.ModelAdmin):
    form = AdminTagForm
    list_display = ("id", "name", "status", "usage_count", "updated_at")
    list_filter = ("status", "updated_at")
    search_fields = ("id", "name")
    fieldsets = (
        ("基础信息", {"fields": ("id", "name", "status", "usage_count")}),
        ("时间", {"fields": ("created_at", "updated_at")}),
    )

    def get_readonly_fields(self, request, obj=None):
        readonly = ["created_at", "updated_at"]
        if obj:
            readonly.append("id")
        return tuple(readonly)

    def save_model(self, request, obj, form, change):
        now = timezone.now()
        if not obj.created_at:
            obj.created_at = now
        obj.updated_at = now
        super().save_model(request, obj, form, change)


admin.site.site_header = "管理后台"
admin.site.site_title = "Luzhi Admin"
admin.site.index_title = "管理控制台"
admin.site.site_url = getattr(settings, "DJANGO_ADMIN_SITE_URL", "/admin/") or None
