from django.urls import path

from api import views

urlpatterns = [
    path("health", views.HealthApi.as_view(), name="health"),
    path("auth/send-code", views.AuthSendCodeApi.as_view(), name="auth-send-code"),
    path("auth/login", views.AuthLoginApi.as_view(), name="auth-login"),
    path("auth/register", views.AuthRegisterApi.as_view(), name="auth-register"),
    path("contents", views.ContentListApi.as_view(), name="contents-list"),
    path("prompts/<str:resource_id>", views.PromptDetailApi.as_view(), name="prompts-detail"),
    path("mcps/<str:resource_id>", views.McpDetailApi.as_view(), name="mcps-detail"),
    path("skills/<str:resource_id>", views.SkillDetailApi.as_view(), name="skills-detail"),
    path("tutorials/<str:resource_id>", views.TutorialDetailApi.as_view(), name="tutorials-detail"),

    path("authoring/records", views.AuthoringRecordsApi.as_view(), name="authoring-records"),
    path("authoring/records/<str:content_type>/<str:resource_id>", views.AuthoringRecordApi.as_view(), name="authoring-record-item"),
    path("authoring/records/<str:content_type>/<str:resource_id>/submit", views.AuthoringSubmitApi.as_view(), name="authoring-submit"),
    path("authoring/records/<str:content_type>/<str:resource_id>/status", views.AuthoringStatusApi.as_view(), name="authoring-status"),

    path("social/vote", views.SocialVoteApi.as_view(), name="social-vote"),
    path("social/vote/toggle", views.SocialVoteToggleApi.as_view(), name="social-vote-toggle"),
    path("social/favorite", views.SocialFavoriteApi.as_view(), name="social-favorite"),
    path("social/favorite/toggle", views.SocialFavoriteToggleApi.as_view(), name="social-favorite-toggle"),
    path("social/favorites", views.SocialFavoritesApi.as_view(), name="social-favorites"),
    path("social/comments", views.SocialCommentsApi.as_view(), name="social-comments"),
    path("social/comments/<str:comment_id>", views.SocialCommentDeleteApi.as_view(), name="social-comment-delete"),

    path("audit/logs", views.AuditLogsApi.as_view(), name="audit-logs"),

    path("admin/review/queue", views.AdminReviewQueueApi.as_view(), name="admin-review-queue"),
    path("admin/review/items/<str:content_type>/<str:resource_id>", views.AdminReviewItemApi.as_view(), name="admin-review-item"),
    path("admin/review/items/<str:content_type>/<str:resource_id>/approve", views.AdminReviewApproveApi.as_view(), name="admin-review-approve"),
    path("admin/review/items/<str:content_type>/<str:resource_id>/reject", views.AdminReviewRejectApi.as_view(), name="admin-review-reject"),
    path("admin/review/items/<str:content_type>/<str:resource_id>/list", views.AdminReviewListApi.as_view(), name="admin-review-list"),
    path("admin/review/items/<str:content_type>/<str:resource_id>/unlist", views.AdminReviewUnlistApi.as_view(), name="admin-review-unlist"),
    path("admin/review/items/<str:content_type>/<str:resource_id>/rollback", views.AdminReviewRollbackApi.as_view(), name="admin-review-rollback"),

    path("admin/console/categories", views.AdminCategoriesApi.as_view(), name="admin-categories"),
    path("admin/console/categories/<str:category_id>/status", views.AdminCategoryStatusApi.as_view(), name="admin-categories-status"),
    path("admin/console/tags", views.AdminTagsApi.as_view(), name="admin-tags"),
    path("admin/console/tags/<str:tag_id>/status", views.AdminTagStatusApi.as_view(), name="admin-tags-status"),
    path("admin/console/events", views.AdminEventsApi.as_view(), name="admin-events"),
    path("admin/console/event-actors", views.AdminEventActorsApi.as_view(), name="admin-event-actors"),
]
