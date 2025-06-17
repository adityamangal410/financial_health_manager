from datetime import date
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fhm import Transaction, get_month_details, yoy_monthly_expenses


def test_get_month_details():
    txs = [
        Transaction(date=date(2024, 1, 1), category="income", amount=3000.0),
        Transaction(date=date(2024, 1, 2), category="rent", amount=-1000.0),
        Transaction(date=date(2024, 1, 3), category="groceries", amount=-200.0),
        Transaction(date=date(2024, 2, 1), category="income", amount=500.0),
    ]

    result = get_month_details(txs, "2024-01")
    assert result["income"] == 3000.0
    assert result["rent"] == -1000.0
    assert result["groceries"] == -200.0


def test_yoy_monthly_expenses():
    txs = [
        Transaction(date=date(2024, 1, 1), category="income", amount=3000.0),
        Transaction(date=date(2024, 1, 2), category="rent", amount=-1000.0),
        Transaction(date=date(2024, 2, 3), category="rent", amount=-900.0),
        Transaction(date=date(2025, 1, 1), category="income", amount=3500.0),
        Transaction(date=date(2025, 1, 2), category="rent", amount=-1100.0),
    ]

    trends = yoy_monthly_expenses(txs)
    assert trends["01"] == 1050.0
    assert trends["02"] == 900.0
