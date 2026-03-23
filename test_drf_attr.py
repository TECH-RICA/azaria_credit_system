import sys
from contextlib import contextmanager

@contextmanager
def wrap_attributeerrors():
    try:
        yield
    except AttributeError:
        info = sys.exc_info()
        e = info[1]
        raise e.with_traceback(info[2])

class User:
    pass

class Request:
    @property
    def user(self):
        with wrap_attributeerrors():
            return getattr(User(), "national_id")

try:
    req = Request()
    req.user
except Exception as e:
    import traceback
    traceback.print_exc()
