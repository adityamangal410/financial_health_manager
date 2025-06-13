import pytest
from datetime import date

import sys
from pathlib import Path

# Ensure the repository root is on the import path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import parse_csv, summarize, savings_rate


def test_parse_csv(tmp_path):
    csv_text = "2024-01-01,income,3000\n2024-01-02,rent,-1200\n"
    path = tmp_path / "transactions.csv"
    path.write_text(csv_text)

    result = parse_csv(str(path))

    assert result == [
        (date(2024, 1, 1), "income", 3000.0),
        (date(2024, 1, 2), "rent", -1200.0),
    ]


def test_parse_csv_with_header_and_multiple_files(tmp_path):
    csv1 = "Date,Description,Amount\n01/05/2024,Coffee,-5\n"
    csv2 = "2024-01-06,income,100\n"
    path1 = tmp_path / "card.csv"
    path1.write_text(csv1)
    path2 = tmp_path / "extra.csv"
    path2.write_text(csv2)

    result = parse_csv([str(path1), str(path2)])

    assert result == [
        (date(2024, 1, 5), "Coffee", -5.0),
        (date(2024, 1, 6), "income", 100.0),
    ]


def test_summarize_and_savings_rate():
    transactions = [
        (date(2024, 1, 1), "income", 3000.0),
        (date(2024, 1, 2), "rent", -1000.0),
        (date(2024, 1, 3), "grocery", -500.0),
        (date(2024, 2, 1), "income", 3500.0),
        (date(2024, 2, 2), "rent", -1200.0),
    ]
    cat_totals, month_data, overall = summarize(transactions)

    assert cat_totals["income"] == 6500.0
    assert overall == pytest.approx(sum(cat_totals.values()))

    rates = savings_rate(month_data)
    assert rates["2024-01"] == pytest.approx(50.0)
    assert rates["2024-02"] == pytest.approx(((3500 - 1200) / 3500) * 100)
