from __future__ import annotations

from datetime import datetime, timezone

from django.contrib import admin as django_admin
from django.contrib.admin.sites import AdminSite
from django.test import TestCase

from api.admin import (
    AdminCategoryAdmin,
    AdminTagAdmin,
    ContentRecordAdmin,
    ContentRecordAdminForm,
    StateDocumentAdmin,
)
from api.models import AdminCategory, AdminTag, ContentRecord, StateDocument


class AdminDisplayTests(TestCase):
    def setUp(self) -> None:
        now = datetime(2026, 3, 5, 12, 0, 0, tzinfo=timezone.utc)
        self.content = ContentRecord.objects.create(
            resource_id="tutorial-community-knowledge-base-001",
            content_type="tutorial",
            status="Listed",
            title="Community Knowledge Base",
            one_liner="A practical tutorial",
            category_ids=["community"],
            tag_ids=["guide", "onboarding"],
            author_id="user-001",
            cover_asset_id=None,
            created_at=now,
            updated_at=now,
            detail={
                "content": {
                    "id": "tutorial-community-knowledge-base-001",
                    "title": "Community Knowledge Base",
                },
                "tutorial": {
                    "difficulty": "easy",
                },
            },
        )
        self.state_doc = StateDocument.objects.create(
            key="admin_console",
            payload={
                "categories": [{"id": "community", "name": "Community"}],
                "tags": [{"id": "guide", "name": "Guide"}],
            },
        )
        self.category = AdminCategory.objects.create(
            id="community",
            name="Community",
            parent_id=None,
            description="for-admin-display-test",
            status="active",
            usage_count=0,
            created_at=now,
            updated_at=now,
        )
        self.tag = AdminTag.objects.create(
            id="guide",
            name="Guide",
            status="active",
            usage_count=0,
            created_at=now,
            updated_at=now,
        )

    def test_content_record_admin_has_readable_detail_preview(self) -> None:
        admin_obj = ContentRecordAdmin(ContentRecord, AdminSite())

        # RED baseline: admin should provide a structured, readable preview field.
        self.assertIn("detail_pretty", admin_obj.get_readonly_fields(request=None, obj=self.content))
        html = admin_obj.detail_pretty(self.content)
        self.assertIn("<pre", html)
        self.assertIn('"content"', html)
        self.assertIn('"tutorial"', html)

    def test_content_record_admin_uses_chinese_fieldsets(self) -> None:
        admin_obj = ContentRecordAdmin(ContentRecord, AdminSite())
        headings = [name for name, _ in admin_obj.fieldsets]
        self.assertIn("基础信息", headings)
        self.assertIn("Detail 结构化预览（只读）", headings)

    def test_django_admin_view_site_url_defaults_to_admin_home(self) -> None:
        # Avoid default "/" because current backend has no root page and would 404.
        self.assertEqual(django_admin.site.site_url, "/admin/")

    def test_django_admin_site_header_is_admin_console(self) -> None:
        self.assertEqual(django_admin.site.site_header, "管理后台")

    def test_state_document_admin_has_readable_payload_preview(self) -> None:
        admin_obj = StateDocumentAdmin(StateDocument, AdminSite())
        self.assertIn("payload_pretty", admin_obj.get_readonly_fields(request=None, obj=self.state_doc))
        html = admin_obj.payload_pretty(self.state_doc)
        self.assertIn("<pre", html)
        self.assertIn('"categories"', html)
        self.assertIn('"tags"', html)

    def test_taxonomy_model_admin_has_chinese_fieldsets(self) -> None:
        category_admin = AdminCategoryAdmin(AdminCategory, AdminSite())
        tag_admin = AdminTagAdmin(AdminTag, AdminSite())

        category_headings = [name for name, _ in category_admin.fieldsets]
        tag_headings = [name for name, _ in tag_admin.fieldsets]

        self.assertIn("基础信息", category_headings)
        self.assertIn("层级与描述", category_headings)
        self.assertIn("基础信息", tag_headings)
        self.assertIn("时间", tag_headings)
        self.assertIn("created_at", category_admin.get_readonly_fields(request=None, obj=self.category))
        self.assertIn("updated_at", category_admin.get_readonly_fields(request=None, obj=self.category))
        self.assertIn("created_at", tag_admin.get_readonly_fields(request=None, obj=self.tag))
        self.assertIn("updated_at", tag_admin.get_readonly_fields(request=None, obj=self.tag))

    def test_content_record_form_uses_selector_and_name_inputs_for_taxonomy(self) -> None:
        form = ContentRecordAdminForm(instance=self.content)

        self.assertIn("category_ids_selected", form.fields)
        self.assertIn("category_ids_new", form.fields)
        self.assertIn("tag_ids_selected", form.fields)
        self.assertIn("tag_ids_new", form.fields)
        self.assertEqual(form.fields["category_ids"].widget.__class__.__name__, "HiddenInput")
        self.assertEqual(form.fields["tag_ids"].widget.__class__.__name__, "HiddenInput")
        self.assertIn(("community", "Community (community)"), form.fields["category_ids_selected"].choices)
        self.assertIn(("guide", "Guide (guide)"), form.fields["tag_ids_selected"].choices)

    def test_content_record_form_save_creates_new_taxonomy_by_name(self) -> None:
        form = ContentRecordAdminForm(
            instance=self.content,
            data={
                "resource_id": self.content.resource_id,
                "content_type": self.content.content_type,
                "status": self.content.status,
                "title": self.content.title,
                "one_liner": self.content.one_liner,
                "category_ids": "[]",
                "tag_ids": "[]",
                "category_ids_selected": ["community"],
                "category_ids_new": "新分类A; 新分类B",
                "tag_ids_selected": ["guide"],
                "tag_ids_new": "实践, 入门",
                "author_id": self.content.author_id,
                "cover_asset_id": self.content.cover_asset_id or "",
                "created_at": self.content.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "updated_at": self.content.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
                "detail": '{"content":{"id":"tutorial-community-knowledge-base-001"}}',
            },
        )

        self.assertTrue(form.is_valid(), form.errors.as_json())
        saved = form.save()
        saved.refresh_from_db()

        self.assertEqual(saved.category_ids[0], "community")
        self.assertIn("cat-新分类a", saved.category_ids)
        self.assertIn("cat-新分类b", saved.category_ids)
        self.assertEqual(saved.tag_ids[0], "guide")
        self.assertIn("tag-实践", saved.tag_ids)
        self.assertIn("tag-入门", saved.tag_ids)
        self.assertTrue(AdminCategory.objects.filter(id="cat-新分类a", name="新分类A").exists())
        self.assertTrue(AdminCategory.objects.filter(id="cat-新分类b", name="新分类B").exists())
        self.assertTrue(AdminTag.objects.filter(id="tag-实践", name="实践").exists())
        self.assertTrue(AdminTag.objects.filter(id="tag-入门", name="入门").exists())
