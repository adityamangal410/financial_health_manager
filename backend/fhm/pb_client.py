from pocketbase import PocketBase


def get_pocketbase_client() -> PocketBase:
    """
    Initializes and returns a PocketBase client instance.
    """
    return PocketBase("http://127.0.0.1:8090")
