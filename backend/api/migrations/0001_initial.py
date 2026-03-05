from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ContentRecord",
            fields=[
                ("resource_id", models.CharField(max_length=120, primary_key=True, serialize=False)),
                (
                    "content_type",
                    models.CharField(
                        choices=[("prompt", "Prompt"), ("mcp", "MCP"), ("skill", "Skill"), ("tutorial", "Tutorial")],
                        db_index=True,
                        max_length=20,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("Draft", "Draft"),
                            ("PendingReview", "PendingReview"),
                            ("Reject", "Reject"),
                            ("Approved", "Approved"),
                            ("Listed", "Listed"),
                            ("Unlisted", "Unlisted"),
                            ("Deleted", "Deleted"),
                        ],
                        db_index=True,
                        default="Listed",
                        max_length=24,
                    ),
                ),
                ("title", models.CharField(max_length=300)),
                ("one_liner", models.TextField(blank=True, null=True)),
                ("category_ids", models.JSONField(blank=True, default=list)),
                ("tag_ids", models.JSONField(blank=True, default=list)),
                ("author_id", models.CharField(default="user-001", max_length=120)),
                ("cover_asset_id", models.CharField(blank=True, max_length=512, null=True)),
                ("created_at", models.DateTimeField()),
                ("updated_at", models.DateTimeField()),
                ("detail", models.JSONField(default=dict)),
            ],
            options={
                "db_table": "content_records",
                "ordering": ["-updated_at", "resource_id"],
            },
        ),
        migrations.CreateModel(
            name="StateDocument",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(max_length=120, unique=True)),
                ("payload", models.JSONField(default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "state_documents",
                "ordering": ["key"],
            },
        ),
    ]
