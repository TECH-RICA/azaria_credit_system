from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.utils import timezone
from .models import Admins, AuditLogs
from .utils.security import get_client_ip
from rest_framework_simplejwt.settings import api_settings

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        """
        Since Admins is not the default AUTH_USER_MODEL, we must explicitly fetch from Admins
        and map the 'user_id' claim to UUID.
        """
        user_id = validated_token.get(api_settings.USER_ID_CLAIM)
        if not user_id:
            return None
            
        try:
            return Admins.objects.get(id=user_id)
        except (Admins.DoesNotExist, ValueError):
            return None

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None

        user, validated_token = result

        # 1. Check user exists and is active
        if not user:
            self._log_threat(None, request, "JWT presented for non-existent user")
            raise AuthenticationFailed("User not found. Access revoked.")

        # 2. Check account not blocked
        if getattr(user, 'is_blocked', False):
            self._log_threat(user, request, f"Blocked user attempted access: {user.email}")
            raise AuthenticationFailed("Account is deactivated.")

        # 3. Check not locked out
        if user.lockout_until and user.lockout_until > timezone.now():
            raise AuthenticationFailed("Account is temporarily locked.")

        # 4. Role validation
        # Skip validation if is_owner is True
        if not getattr(user, 'is_owner', False):
            valid_roles = ['ADMIN', 'MANAGER', 'FINANCIAL_OFFICER', 'FIELD_OFFICER']
            user_role = getattr(user, 'role', None)
            is_super_admin = getattr(user, 'is_super_admin', False)

            if not is_super_admin and (not user_role or user_role not in valid_roles):
                self._log_threat(user, request, f"User {user.email} has no valid role — {user_role}")
                raise AuthenticationFailed("No valid role assigned. Contact administrator.")

        # 5. IP binding check
        token_ip = validated_token.get("client_ip")
        if token_ip:
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            current_ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
            if token_ip != current_ip:
                self._log_threat(user, request,
                    f"IP mismatch for {user.email}. Token IP: {token_ip}, Request IP: {current_ip}")
                raise AuthenticationFailed("Session invalid. Please log in again.")

        # 6. Maintenance Mode Check
        from .utils.encryption import get_setting
        maintenance_active = get_setting("maintenance_mode_active", "false") == "true"
        if maintenance_active:
            # Check if scheduled time has passed
            maintenance_time_str = get_setting("maintenance_schedule_time")
            if maintenance_time_str:
                try:
                    from dateutil import parser
                    scheduled_time = parser.isoparse(maintenance_time_str)
                    if timezone.now() >= scheduled_time:
                        # Allow owner to bypass maintenance mode if they have god_mode or similar?
                        # Usually maintenance locks everyone out.
                        if not getattr(user, 'is_owner', False):
                            raise AuthenticationFailed("System is currently under scheduled maintenance. Please try again later.")
                except (ValueError, TypeError, ImportError):
                    pass

        return user, validated_token

    def _log_threat(self, user, request, message):
        try:
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
            AuditLogs.objects.create(
                admin=user if isinstance(user, Admins) else None,
                action=f"SECURITY THREAT: {message}",
                log_type="SECURITY",
                table_name="admins",
                record_id=getattr(user, 'id', None),
                is_owner_log=True,
                ip_address=ip,
                new_data={"threat": message, "path": request.path}
            )
        except Exception:
            pass
