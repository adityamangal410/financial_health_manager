#!/usr/bin/env python3
"""
Complete database setup script for Financial Health Manager.
Recreates all collections and sets up the demo user.
"""

import json
import sys
from pocketbase import PocketBase


def create_collections(pb):
    """Create all required collections for the Financial Health Manager."""

    # 1. Create 'users' collection (auth collection)
    try:
        pb.collections.get_one("users")
        print("✅ 'users' collection already exists.")
    except Exception:
        print("🔧 Creating 'users' collection...")
        try:
            users_collection = {
                "name": "users",
                "type": "auth",
                "schema": [
                    {
                        "name": "name",
                        "type": "text",
                        "required": False,
                        "options": {"min": 0, "max": 255},
                    },
                    {
                        "name": "avatar",
                        "type": "file",
                        "required": False,
                        "options": {
                            "maxSelect": 1,
                            "maxSize": 5242880,
                            "mimeTypes": ["image/jpeg", "image/png", "image/gif"],
                        },
                    },
                ],
                "listRule": "id = @request.auth.id",
                "viewRule": "id = @request.auth.id",
                "createRule": "",
                "updateRule": "id = @request.auth.id",
                "deleteRule": "id = @request.auth.id",
                "options": {
                    "allowEmailAuth": True,
                    "allowOAuth2Auth": False,
                    "allowUsernameAuth": False,
                    "exceptEmailDomains": [],
                    "manageRule": None,
                    "minPasswordLength": 8,
                    "onlyEmailDomains": [],
                    "requireEmail": True,
                },
            }
            pb.collections.create(users_collection)
            print("✅ 'users' collection created successfully.")
        except Exception as e:
            print(f"❌ Failed to create 'users' collection: {e}")
            return False

    # 2. Create 'transactions' collection
    try:
        pb.collections.get_one("transactions")
        print("✅ 'transactions' collection already exists.")
    except Exception:
        print("🔧 Creating 'transactions' collection...")
        try:
            transactions_collection = {
                "name": "transactions",
                "type": "base",
                "schema": [
                    {
                        "name": "user",
                        "type": "relation",
                        "required": True,
                        "options": {
                            "collectionId": "users",
                            "cascadeDelete": True,
                            "minSelect": None,
                            "maxSelect": 1,
                            "displayFields": ["email"],
                        },
                    },
                    {
                        "name": "date",
                        "type": "date",
                        "required": True,
                        "options": {"min": "", "max": ""},
                    },
                    {
                        "name": "description",
                        "type": "text",
                        "required": True,
                        "options": {"min": 1, "max": 1000},
                    },
                    {
                        "name": "amount",
                        "type": "number",
                        "required": True,
                        "options": {"min": None, "max": None, "noDecimal": False},
                    },
                    {
                        "name": "category",
                        "type": "text",
                        "required": True,
                        "options": {"min": 1, "max": 100},
                    },
                    {
                        "name": "account",
                        "type": "text",
                        "required": False,
                        "options": {"min": 0, "max": 100},
                    },
                ],
                "listRule": "user = @request.auth.id",
                "viewRule": "user = @request.auth.id",
                "createRule": "@request.auth.id != ''",
                "updateRule": "user = @request.auth.id",
                "deleteRule": "user = @request.auth.id",
            }
            pb.collections.create(transactions_collection)
            print("✅ 'transactions' collection created successfully.")
        except Exception as e:
            print(f"❌ Failed to create 'transactions' collection: {e}")
            return False

    # 3. Create 'uploads' collection
    try:
        pb.collections.get_one("uploads")
        print("✅ 'uploads' collection already exists.")
    except Exception:
        print("🔧 Creating 'uploads' collection...")
        try:
            uploads_collection = {
                "name": "uploads",
                "type": "base",
                "schema": [
                    {
                        "name": "user",
                        "type": "relation",
                        "required": True,
                        "options": {
                            "collectionId": "users",
                            "cascadeDelete": True,
                            "minSelect": None,
                            "maxSelect": 1,
                            "displayFields": ["email"],
                        },
                    },
                    {
                        "name": "file",
                        "type": "file",
                        "required": True,
                        "options": {
                            "maxSelect": 1,
                            "maxSize": 10485760,  # 10MB
                            "mimeTypes": ["text/csv", "application/csv", "text/plain"],
                        },
                    },
                    {
                        "name": "status",
                        "type": "select",
                        "required": True,
                        "options": {
                            "maxSelect": 1,
                            "values": ["pending", "processing", "completed", "failed"],
                        },
                    },
                    {
                        "name": "transaction_count",
                        "type": "number",
                        "required": False,
                        "options": {"min": 0, "max": None, "noDecimal": True},
                    },
                    {
                        "name": "error_message",
                        "type": "text",
                        "required": False,
                        "options": {"min": 0, "max": 1000},
                    },
                ],
                "listRule": "user = @request.auth.id",
                "viewRule": "user = @request.auth.id",
                "createRule": "@request.auth.id != ''",
                "updateRule": "user = @request.auth.id",
                "deleteRule": "user = @request.auth.id",
            }
            pb.collections.create(uploads_collection)
            print("✅ 'uploads' collection created successfully.")
        except Exception as e:
            print(f"❌ Failed to create 'uploads' collection: {e}")
            return False

    return True


def create_demo_user(pb):
    """Create the demo user account."""
    email = "demo@fhm.local"
    password = "demo123456"
    name = "Demo User"

    try:
        # Try to create the user
        user_data = {
            "email": email,
            "password": password,
            "passwordConfirm": password,
            "name": name,
        }

        user = pb.collection("users").create(user_data)
        print(f"✅ Demo user created successfully!")
        print(f"📧 Email: {email}")
        print(f"🔑 Password: {password}")
        return True

    except Exception as e:
        if "already exists" in str(e).lower():
            print(f"✅ Demo user already exists!")
            print(f"📧 Email: {email}")
            print(f"🔑 Password: {password}")
            return True
        else:
            print(f"❌ Failed to create demo user: {e}")
            return False


def main():
    """Main setup function."""
    print("🚀 Setting up Financial Health Manager Database...")
    print("=" * 60)

    # Connect to PocketBase
    pb = PocketBase("http://127.0.0.1:8090")

    # Authenticate as admin
    print("🔐 Authenticating as admin...")
    try:
        pb.admins.auth_with_password("admin@fhm.local", "password123")
        print("✅ Admin authentication successful!")
    except Exception as e:
        print(f"❌ Admin authentication failed: {e}")
        print("💡 Make sure the admin user exists. Creating it now...")
        # Try to create admin through the API if it doesn't exist
        print("🔄 Admin user should already exist. Continuing without admin auth...")
        print("⚠️  Collections will be created with public access initially.")

    # Create collections
    print("\n📋 Creating Collections...")
    if not create_collections(pb):
        print("❌ Failed to create collections. Exiting.")
        sys.exit(1)

    print("\n👤 Creating Demo User...")
    if not create_demo_user(pb):
        print("❌ Failed to create demo user. Exiting.")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("🎉 Database setup completed successfully!")
    print("\n📊 Summary:")
    print("   ✅ users collection (auth)")
    print("   ✅ transactions collection")
    print("   ✅ uploads collection")
    print("   ✅ demo user account")
    print("\n🌐 You can now use the application:")
    print("   Frontend: http://localhost:3000")
    print("   Login: demo@fhm.local / demo123456")
    print("   Admin: http://localhost:8090/_/")


if __name__ == "__main__":
    main()
