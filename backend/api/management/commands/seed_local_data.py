from django.core.management.base import BaseCommand

from api.services.seed import ensure_bootstrapped


class Command(BaseCommand):
    help = "Seed backend database from repository data/*.json and default state docs"

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Clear existing seeded rows and re-import")

    def handle(self, *args, **options):
        ensure_bootstrapped(force=bool(options.get("force")))
        self.stdout.write(self.style.SUCCESS("Seed completed."))
