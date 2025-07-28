from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
import pytest
from backend.server import app


@pytest.fixture
def mock_pb_client():
    """Mocks the PocketBase client and its collections."""
    with patch("backend.server.get_pocketbase_client") as mock_get_client:
        mock_client = MagicMock()
        mock_uploads_collection = MagicMock()
        mock_transactions_collection = MagicMock()

        def collection_side_effect(name):
            if name == "uploads":
                return mock_uploads_collection
            elif name == "transactions":
                return mock_transactions_collection
            return MagicMock()

        mock_client.collection.side_effect = collection_side_effect
        mock_get_client.return_value = mock_client

        yield mock_uploads_collection, mock_transactions_collection


client = TestClient(app)


def test_summarize_endpoint_with_pocketbase(mock_pb_client):
    """
    Test that the /summarize endpoint correctly creates records in PocketBase.
    """
    mock_uploads_collection, mock_transactions_collection = mock_pb_client
    csv_content = b"date,category,description,amount,account\n2024-01-01,income,Salary,3000,checking\n2024-01-03,rent,Monthly Rent,-1200,credit"
    files = {"files": ("test.csv", csv_content, "text/csv")}

    response = client.post("/summarize", files=files)

    assert response.status_code == 200
    summary = response.json()
    assert summary["overall_balance"] == 1800

    # Verify that PocketBase 'uploads' collection was called
    mock_uploads_collection.create.assert_called_once()

    # Verify that PocketBase 'transactions' collection was called for each transaction
    assert mock_transactions_collection.create.call_count == 2

    # Check the data sent to the transactions collection
    first_call_args = mock_transactions_collection.create.call_args_list[0].args[0]
    assert first_call_args["description"] == "Salary"
    assert first_call_args["amount"] == 3000

    second_call_args = mock_transactions_collection.create.call_args_list[1].args[0]
    assert second_call_args["description"] == "Monthly Rent"
    assert second_call_args["amount"] == -1200
