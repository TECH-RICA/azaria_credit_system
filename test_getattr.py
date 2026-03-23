class Request:
    def __getattr__(self, name):
        raise AttributeError("Custom error")

try:
    getattr(Request(), "user")
except Exception as e:
    import traceback
    traceback.print_exc()
