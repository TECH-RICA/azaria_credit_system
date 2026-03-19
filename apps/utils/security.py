from ..models import AuditLogs
from django.utils import timezone


def log_action(
    admin,
    action,
    table_name,
    record_id=None,
    old_data=None,
    new_data=None,
    log_type="GENERAL",
    ip_address=None,
):
    """
    Utility function to log actions in the system.
    """

    def prepare_json_data(data):
        if data is None:
            return None
        import json
        from django.core.serializers.json import DjangoJSONEncoder

        # Use Django's encoder to handle UUIDs, Decimals, etc.
        return json.loads(json.dumps(data, cls=DjangoJSONEncoder))

    AuditLogs.objects.create(
        admin=admin,
        action=action,
        table_name=table_name,
        record_id=record_id,
        old_data=prepare_json_data(old_data),
        new_data=prepare_json_data(new_data),
        log_type=log_type,
        ip_address=ip_address,
    )


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


def get_filtered_queryset(user, queryset, branch_field='branch_fk'):
    """
    Returns queryset filtered by user's role and branch.
    Raises PermissionDenied if user has no valid role.
    """
    from rest_framework.exceptions import PermissionDenied
    
    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication required.")
    
    # Owner and Super Admin see everything
    if getattr(user, 'is_owner', False) or getattr(user, 'is_super_admin', False):
        return queryset
    
    role = getattr(user, 'role', None)
    
    if role == 'ADMIN':
        return queryset
    
    if role == 'MANAGER':
        if not user.branch_fk:
            raise PermissionDenied("No branch assigned.")
        return queryset.filter(**{branch_field: user.branch_fk})
    
    if role == 'FIELD_OFFICER':
        if not user.branch_fk:
            raise PermissionDenied("No branch assigned.")
        return queryset.filter(**{branch_field: user.branch_fk})
    
    if role == 'FINANCIAL_OFFICER':
        return queryset  # Finance sees all branches
    
    # No valid role — log and deny
    from ..models import AuditLogs
    AuditLogs.objects.create(
        admin=user,
        action=f"SECURITY: User {user.email} attempted data access with no valid role",
        log_type="SECURITY",
        table_name="system",
        is_owner_log=True,
    )
    raise PermissionDenied("No valid role. Access denied.")
