from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.models import AuditLogs

class Command(BaseCommand):
    help = 'Purges old audit logs to keep the database size manageable'

    def handle(self, *args, **options):
        # 1. Purge generic system logs older than 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        system_logs = AuditLogs.objects.filter(
            action_type__in=['SYSTEM_START', 'SYSTEM_CLEANUP', 'TASK_COMPLETED'],
            created_at__lt=thirty_days_ago
        )
        count, _ = system_logs.delete()
        self.stdout.write(self.style.SUCCESS(f'Purged {count} system logs older than 30 days.'))

        # 2. Purge all logs older than 90 days (Retention policy)
        ninety_days_ago = timezone.now() - timedelta(days=90)
        old_logs = AuditLogs.objects.filter(created_at__lt=ninety_days_ago)
        count, _ = old_logs.delete()
        self.stdout.write(self.style.SUCCESS(f'Purged {count} general audit logs older than 90 days.'))

        self.stdout.write(self.style.SUCCESS('Audit log maintenance completed.'))
