from apps.models import Users
print(getattr(Users(), "national_id", "OK"))
