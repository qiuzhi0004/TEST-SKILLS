from __future__ import annotations

from rest_framework import status
from rest_framework.test import APITestCase

from api.models import AdminCategory, AdminTag


class AdminConsoleContractTests(APITestCase):
    base = "/api/v1/admin/console"

    def test_categories_contract(self) -> None:
        list_response = self.client.get(f"{self.base}/categories")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertIn("items", list_response.data)
        self.assertIsInstance(list_response.data["items"], list)
        self.assertGreater(len(list_response.data["items"]), 0)

        first = list_response.data["items"][0]
        for field in ["id", "name", "status", "description", "parent_id", "usage_count", "created_at", "updated_at"]:
            self.assertIn(field, first)

        create_response = self.client.post(
            f"{self.base}/categories",
            {"name": "契约测试分类", "description": "for-contract-test", "actor": "tester-contract"},
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        created = create_response.data
        self.assertIn("id", created)
        self.assertEqual(created["name"], "契约测试分类")
        self.assertEqual(created["status"], "active")
        self.assertTrue(
            AdminCategory.objects.filter(id=created["id"], name="契约测试分类", status="active").exists()
        )

        toggle_response = self.client.post(
            f"{self.base}/categories/{created['id']}/status",
            {"status": "inactive", "actor": "tester-contract"},
            format="json",
        )
        self.assertEqual(toggle_response.status_code, status.HTTP_200_OK)
        self.assertEqual(toggle_response.data, {"ok": True})
        self.assertEqual(AdminCategory.objects.get(id=created["id"]).status, "inactive")

    def test_tags_contract(self) -> None:
        list_response = self.client.get(f"{self.base}/tags")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertIn("items", list_response.data)
        self.assertIsInstance(list_response.data["items"], list)
        self.assertGreater(len(list_response.data["items"]), 0)

        first = list_response.data["items"][0]
        for field in ["id", "name", "status", "usage_count", "created_at", "updated_at"]:
            self.assertIn(field, first)

        create_response = self.client.post(
            f"{self.base}/tags",
            {"name": "契约测试标签", "actor": "tester-contract"},
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        created = create_response.data
        self.assertIn("id", created)
        self.assertEqual(created["name"], "契约测试标签")
        self.assertEqual(created["status"], "active")
        self.assertTrue(
            AdminTag.objects.filter(id=created["id"], name="契约测试标签", status="active").exists()
        )

        toggle_response = self.client.post(
            f"{self.base}/tags/{created['id']}/status",
            {"status": "inactive", "actor": "tester-contract"},
            format="json",
        )
        self.assertEqual(toggle_response.status_code, status.HTTP_200_OK)
        self.assertEqual(toggle_response.data, {"ok": True})
        self.assertEqual(AdminTag.objects.get(id=created["id"]).status, "inactive")

    def test_events_contract(self) -> None:
        events_response = self.client.get(
            f"{self.base}/events",
            {"offset": 0, "limit": 10, "type": "all", "actor": "all"},
        )
        self.assertEqual(events_response.status_code, status.HTTP_200_OK)
        self.assertIn("items", events_response.data)
        self.assertIn("meta", events_response.data)
        self.assertIsInstance(events_response.data["items"], list)
        self.assertIsInstance(events_response.data["meta"], dict)

        meta = events_response.data["meta"]
        for field in ["offset", "limit", "total"]:
            self.assertIn(field, meta)
            self.assertIsInstance(meta[field], int)

        if events_response.data["items"]:
            first = events_response.data["items"][0]
            for field in ["id", "at", "actor", "type", "target_type", "summary"]:
                self.assertIn(field, first)

        actors_response = self.client.get(f"{self.base}/event-actors")
        self.assertEqual(actors_response.status_code, status.HTTP_200_OK)
        self.assertIn("items", actors_response.data)
        self.assertIsInstance(actors_response.data["items"], list)
        self.assertTrue(all(isinstance(item, str) for item in actors_response.data["items"]))
