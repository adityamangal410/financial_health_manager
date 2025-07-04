from pathlib import Path

from fastapi.testclient import TestClient

import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import app

client = TestClient(app)


def test_summarize_endpoint(tmp_path):
    csv_text = "Date,Category,Amount\n2024-01-01,income,100\n2024-01-02,rent,-50\n"
    path = tmp_path / "t.csv"
    path.write_text(csv_text)

    with path.open("rb") as f:
        files = {"files": ("t.csv", f, "text/csv")}
        resp = client.post("/summarize", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["overall_balance"] == 50.0
    assert data["savings_rate"]["2024-01"] == 50.0


def test_summarize_multiple_files(tmp_path):
    path1 = tmp_path / "a.csv"
    path1.write_text("Date,Category,Amount\n2024-01-01,income,100\n")
    path2 = tmp_path / "b.csv"
    path2.write_text("Date,Category,Amount\n2024-01-02,rent,-60\n")

    with path1.open("rb") as f1, path2.open("rb") as f2:
        files = [
            ("files", ("a.csv", f1, "text/csv")),
            ("files", ("b.csv", f2, "text/csv")),
        ]
        resp = client.post("/summarize", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["overall_balance"] == 40.0


def test_month_details_endpoint(tmp_path):
    path = tmp_path / "t.csv"
    path.write_text(
        "Date,Category,Amount\n2024-01-01,rent,-100\n2024-01-02,income,200\n"
    )

    with path.open("rb") as f:
        files = {"files": ("t.csv", f, "text/csv")}
        resp = client.post("/month/2024-01", files=files)

    assert resp.status_code == 200
    data = resp.json()
    assert data["rent"] == -100
    assert data["income"] == 200


def test_yoy_endpoint(tmp_path):
    path1 = tmp_path / "a.csv"
    path1.write_text(
        "Date,Category,Amount\n2024-01-01,income,100\n2024-01-02,rent,-50\n"
    )
    path2 = tmp_path / "b.csv"
    path2.write_text(
        "Date,Category,Amount\n2025-01-01,income,150\n2025-01-02,rent,-70\n"
    )

    with path1.open("rb") as f1, path2.open("rb") as f2:
        files = [
            ("files", ("a.csv", f1, "text/csv")),
            ("files", ("b.csv", f2, "text/csv")),
        ]
        resp = client.post("/yoy", files=files)

    assert resp.status_code == 200
    data = resp.json()
    assert data["01"] == 60
