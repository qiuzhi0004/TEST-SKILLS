from django.db import models


class ContentType(models.TextChoices):
    PROMPT = "prompt", "Prompt"
    MCP = "mcp", "MCP"
    SKILL = "skill", "Skill"
    TUTORIAL = "tutorial", "Tutorial"


class ContentStatus(models.TextChoices):
    DRAFT = "Draft", "Draft"
    PENDING_REVIEW = "PendingReview", "PendingReview"
    REJECT = "Reject", "Reject"
    APPROVED = "Approved", "Approved"
    LISTED = "Listed", "Listed"
    UNLISTED = "Unlisted", "Unlisted"
    DELETED = "Deleted", "Deleted"


class TaxonomyStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"


class ContentRecord(models.Model):
    resource_id = models.CharField(max_length=120, primary_key=True)
    content_type = models.CharField(max_length=20, choices=ContentType.choices, db_index=True)
    status = models.CharField(max_length=24, choices=ContentStatus.choices, default=ContentStatus.LISTED, db_index=True)
    title = models.CharField(max_length=300)
    one_liner = models.TextField(blank=True, null=True)
    category_ids = models.JSONField(default=list, blank=True)
    tag_ids = models.JSONField(default=list, blank=True)
    author_id = models.CharField(max_length=120, default="user-001")
    cover_asset_id = models.CharField(max_length=512, blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    detail = models.JSONField(default=dict)

    class Meta:
        db_table = "content_records"
        ordering = ["-updated_at", "resource_id"]


class AdminCategory(models.Model):
    id = models.CharField(max_length=120, primary_key=True)
    name = models.CharField(max_length=180)
    parent_id = models.CharField(max_length=120, blank=True, null=True)
    description = models.TextField(blank=True, default="")
    status = models.CharField(max_length=16, choices=TaxonomyStatus.choices, default=TaxonomyStatus.ACTIVE, db_index=True)
    usage_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField(db_index=True)

    class Meta:
        db_table = "admin_categories"
        ordering = ["-updated_at", "id"]
        verbose_name = "分类"
        verbose_name_plural = "分类"

    def __str__(self) -> str:
        return f"{self.id} · {self.name}"


class AdminTag(models.Model):
    id = models.CharField(max_length=120, primary_key=True)
    name = models.CharField(max_length=180)
    status = models.CharField(max_length=16, choices=TaxonomyStatus.choices, default=TaxonomyStatus.ACTIVE, db_index=True)
    usage_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField(db_index=True)

    class Meta:
        db_table = "admin_tags"
        ordering = ["-updated_at", "id"]
        verbose_name = "标签"
        verbose_name_plural = "标签"

    def __str__(self) -> str:
        return f"{self.id} · {self.name}"


class StateDocument(models.Model):
    key = models.CharField(max_length=120, unique=True)
    payload = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "state_documents"
        ordering = ["key"]

    def __str__(self) -> str:
        return self.key
