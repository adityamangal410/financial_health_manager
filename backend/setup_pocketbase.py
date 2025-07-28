import getpass
from pocketbase import PocketBase


def main():
    """
    Connects to PocketBase, authenticates, and creates the required collections.
    """
    client = PocketBase("http://127.0.0.1:8090")

    admin_email = input("Enter admin email: ")
    admin_password = getpass.getpass("Enter admin password: ")

    try:
        client.admins.auth_with_password(admin_email, admin_password)
        print("Admin authentication successful.")
    except Exception as e:
        print(f"Admin authentication failed: {e}")
        return

    # 1. Create 'users' collection (extending auth collection)
    try:
        client.collections.get_one("users")
        print("'users' collection already exists.")
    except Exception:
        print("Creating 'users' collection...")
        try:
            client.collections.create(
                {
                    "name": "users",
                    "type": "auth",
                    "schema": [
                        {"name": "name", "type": "text", "required": False},
                        {
                            "name": "avatar",
                            "type": "file",
                            "options": {"maxSize": 5242880},
                        },
                    ],
                }
            )
            print("'users' collection created successfully.")
        except Exception as e:
            print(f"Failed to create 'users' collection: {e}")

    # 2. Create 'transactions' collection
    try:
        client.collections.get_one("transactions")
        print("'transactions' collection already exists.")
    except Exception:
        print("Creating 'transactions' collection...")
        try:
            client.collections.create(
                {
                    "name": "transactions",
                    "type": "base",
                    "schema": [
                        {
                            "name": "user",
                            "type": "relation",
                            "required": True,
                            "options": {
                                "collectionId": "users",
                                "maxSelect": 1,
                                "cascadeDelete": True,
                            },
                        },
                        {"name": "date", "type": "date", "required": True},
                        {"name": "description", "type": "text", "required": True},
                        {"name": "amount", "type": "number", "required": True},
                        {"name": "category", "type": "text", "required": True},
                        {"name": "account", "type": "text"},
                    ],
                }
            )
            print("'transactions' collection created successfully.")
        except Exception as e:
            print(f"Failed to create 'transactions' collection: {e}")

    # 3. Create 'uploads' collection
    try:
        client.collections.get_one("uploads")
        print("'uploads' collection already exists.")
    except Exception:
        print("Creating 'uploads' collection...")
        try:
            client.collections.create(
                {
                    "name": "uploads",
                    "type": "base",
                    "schema": [
                        {
                            "name": "user",
                            "type": "relation",
                            "required": True,
                            "options": {
                                "collectionId": "users",
                                "maxSelect": 1,
                                "cascadeDelete": True,
                            },
                        },
                        {
                            "name": "file",
                            "type": "file",
                            "required": True,
                            "options": {"maxSize": 5242880},
                        },
                        {
                            "name": "status",
                            "type": "select",
                            "required": True,
                            "options": {
                                "values": [
                                    "pending",
                                    "processing",
                                    "completed",
                                    "failed",
                                ],
                            },
                        },
                        {"name": "transaction_count", "type": "number"},
                    ],
                }
            )
            print("'uploads' collection created successfully.")
        except Exception as e:
            print(f"Failed to create 'uploads' collection: {e}")


if __name__ == "__main__":
    main()
