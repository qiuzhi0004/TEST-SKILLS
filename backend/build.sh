#!/usr/bin/env bash
set -o errexit

python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate --no-input

# Optional, but recommended for Render free tier:
# create or sync Django admin user on each deploy, without using Render Shell.
if [[ -n "${DJANGO_SUPERUSER_USERNAME:-}" && -n "${DJANGO_SUPERUSER_EMAIL:-}" && -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]]; then
  python manage.py shell <<'PY'
import os
from django.contrib.auth import get_user_model

User = get_user_model()
username = os.environ["DJANGO_SUPERUSER_USERNAME"]
email = os.environ["DJANGO_SUPERUSER_EMAIL"]
password = os.environ["DJANGO_SUPERUSER_PASSWORD"]

user, created = User.objects.get_or_create(
    username=username,
    defaults={
        "email": email,
        "is_staff": True,
        "is_superuser": True,
    },
)

changed = created
if user.email != email:
    user.email = email
    changed = True
if not user.is_staff:
    user.is_staff = True
    changed = True
if not user.is_superuser:
    user.is_superuser = True
    changed = True
if not user.has_usable_password() or not user.check_password(password):
    user.set_password(password)
    changed = True

if changed:
    user.save()

print(f"[build.sh] superuser synced: {username} (created={created}, changed={changed})")
PY
else
  echo "[build.sh] skip superuser sync (DJANGO_SUPERUSER_USERNAME/EMAIL/PASSWORD not fully set)"
fi
