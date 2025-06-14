import pytest
from datetime import date

import sys
from pathlib import Path

# Ensure the repository root is on the import path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fhm import parse_csv, summarize
from fhm.models import Transaction


def test_parse_csv(tmp_path):
    csv_text = "Date,Category,Amount\n2024-01-01,income,3000\n2024-01-02,rent,-1200\n"
    path = tmp_path / "transactions.csv"
    path.write_text(csv_text)

    result = parse_csv(str(path))

    assert result == [
        Transaction(date=date(2024, 1, 1), category="income", amount=3000.0),
        Transaction(date=date(2024, 1, 2), category="rent", amount=-1200.0),
    ]


def test_parse_csv_with_header_and_multiple_files(tmp_path):
    csv1 = "Date,Description,Amount\n01/05/2024,Coffee,-5\n"
    csv2 = "Date,Category,Amount\n2024-01-06,income,100\n"
    path1 = tmp_path / "card.csv"
    path1.write_text(csv1)
    path2 = tmp_path / "extra.csv"
    path2.write_text(csv2)

    result = parse_csv([str(path1), str(path2)])

    assert result == [
        Transaction(date=date(2024, 1, 5), category="Coffee", amount=-5.0),
        Transaction(date=date(2024, 1, 6), category="income", amount=100.0),
    ]


def test_summarize_and_savings_rate():
    transactions = [
        Transaction(date=date(2024, 1, 1), category="income", amount=3000.0),
        Transaction(date=date(2024, 1, 2), category="rent", amount=-1000.0),
        Transaction(date=date(2024, 1, 3), category="grocery", amount=-500.0),
        Transaction(date=date(2024, 2, 1), category="income", amount=3500.0),
        Transaction(date=date(2024, 2, 2), category="rent", amount=-1200.0),
    ]
    summary = summarize(transactions)

    assert summary.category_totals["income"] == 6500.0
    assert summary.overall_balance == pytest.approx(
        sum(summary.category_totals.values())
    )

    rates = summary.savings_rate
    assert rates["2024-01"] == pytest.approx(50.0)
    assert rates["2024-02"] == pytest.approx(((3500 - 1200) / 3500) * 100)


def test_parse_csv_skips_bad_rows(tmp_path):
    csv_text = (
        "Date,Description,Amount\n2024-01-01,income,100\nbad,row\n2024-01-02,rent,-50\n"
    )
    path = tmp_path / "messy.csv"
    path.write_text(csv_text)

    result = parse_csv(str(path))

    assert result == [
        Transaction(date=date(2024, 1, 1), category="income", amount=100.0),
        Transaction(date=date(2024, 1, 2), category="rent", amount=-50.0),
    ]


def test_parse_csv_header_whitespace(tmp_path):
    csv_text = "  Run Date , Description , Amount ($)\n06/12/2025,Deposit,100\n"
    path = tmp_path / "ws.csv"
    path.write_text(csv_text)

    result = parse_csv(str(path))

    assert result == [
        Transaction(date=date(2025, 6, 12), category="Deposit", amount=100.0)
    ]
