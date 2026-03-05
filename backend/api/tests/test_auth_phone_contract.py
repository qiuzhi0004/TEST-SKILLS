from __future__ import annotations

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase


class AuthPhoneContractTests(APITestCase):
    base = "/api/v1/auth"

    def test_send_code_contract(self) -> None:
        response = self.client.post(
            f"{self.base}/send-code",
            {"phone": "13800000001", "purpose": "login"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("ok"), True)
        self.assertEqual(response.data.get("phone"), "13800000001")
        self.assertEqual(response.data.get("purpose"), "login")
        self.assertEqual(response.data.get("mock_code"), "123456")

    def test_register_success_creates_django_user(self) -> None:
        response = self.client.post(
            f"{self.base}/register",
            {"nickname": "测试用户", "phone": "13800000002", "code": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["phone"], "13800000002")
        self.assertEqual(response.data["user"]["nickname"], "测试用户")
        self.assertTrue(User.objects.filter(username="13800000002", first_name="测试用户").exists())

    def test_register_existing_phone_returns_conflict(self) -> None:
        User.objects.create(username="13800000003", first_name="已有用户")

        response = self.client.post(
            f"{self.base}/register",
            {"nickname": "重复注册", "phone": "13800000003", "code": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data.get("code"), "PHONE_ALREADY_REGISTERED")

    def test_login_unregistered_phone_returns_hint(self) -> None:
        response = self.client.post(
            f"{self.base}/login",
            {"phone": "13800000004", "code": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data.get("code"), "PHONE_NOT_REGISTERED")

    def test_login_wrong_code_returns_validation_error(self) -> None:
        user = User.objects.create(username="13800000005", first_name="验证码用户")
        user.set_unusable_password()
        user.save(update_fields=["password"])

        response = self.client.post(
            f"{self.base}/login",
            {"phone": "13800000005", "code": "000000"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)

    def test_login_success_contract(self) -> None:
        user = User.objects.create(username="13800000006", first_name="登录用户")
        user.set_unusable_password()
        user.save(update_fields=["password"])

        response = self.client.post(
            f"{self.base}/login",
            {"phone": "13800000006", "code": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["phone"], "13800000006")
        self.assertEqual(response.data["user"]["nickname"], "登录用户")
