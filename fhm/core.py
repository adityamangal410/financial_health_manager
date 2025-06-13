"""Core finance utilities for parsing CSVs and generating summaries."""

from __future__ import annotations

import csv
from collections import defaultdict
from datetime import date, datetime
from typing import Iterable, List, Optional, Sequence, Tuple, Union


DATE_FIELDS = {
    "date",
    "transaction date",
    "posting date",
    "settlement date",
    "run date",
}

CATEGORY_FIELDS = {
    "category",
    "description",
    "transaction type",
    "type",
    "details",
}

AMOUNT_FIELDS = {"amount"}
CREDIT_FIELDS = {"credit"}
DEBIT_FIELDS = {"debit"}


def _parse_date(text: str) -> date:
    """Return a ``date`` object from various common formats."""
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
        try:
            return datetime.strptime(text.strip(), fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unsupported date format: {text}")


def _parse_amount(text: str) -> float:
    """Convert an amount string to ``float``."""
    cleaned = text.replace("$", "").replace(",", "").strip()
    if not cleaned:
        return 0.0
    if cleaned.startswith("(") and cleaned.endswith(")"):
        return -float(cleaned[1:-1])
    return float(cleaned)


def _find_index(header: Sequence[str], options: Iterable[str]) -> Optional[int]:
    """Return the index of the first matching option in ``header``."""
    lower = [h.lower() for h in header]
    for name in options:
        if name in lower:
            return lower.index(name)
    return None


def _parse_csv_file(path: str) -> List[Tuple[date, str, float]]:
    """Parse a single CSV file of transactions."""
    transactions: List[Tuple[date, str, float]] = []
    with open(path, newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        return transactions

    header: Optional[List[str]] = None
    try:
        _parse_date(rows[0][0])
    except Exception:
        header = rows.pop(0)

    if header is None:
        for row in rows:
            if not row:
                continue
            tx_date = _parse_date(row[0])
            category = row[1]
            amount = _parse_amount(row[2])
            transactions.append((tx_date, category, amount))
        return transactions

    date_idx = _find_index(header, DATE_FIELDS)
    if date_idx is None:
        raise ValueError("Date column not found; please preprocess the file.")

    amount_idx = _find_index(header, AMOUNT_FIELDS)
    credit_idx = _find_index(header, CREDIT_FIELDS)
    debit_idx = _find_index(header, DEBIT_FIELDS)
    category_idx = _find_index(header, CATEGORY_FIELDS)

    for row in rows:
        if not row:
            continue
        tx_date = _parse_date(row[date_idx])
        if amount_idx is not None:
            amount = _parse_amount(row[amount_idx])
        else:
            credit = _parse_amount(row[credit_idx]) if credit_idx is not None else 0.0
            debit = _parse_amount(row[debit_idx]) if debit_idx is not None else 0.0
            amount = credit - debit
        category = row[category_idx] if category_idx is not None else "uncategorized"
        transactions.append((tx_date, category, amount))

    return transactions


def parse_csv(paths: Union[str, Sequence[str]]) -> List[Tuple[date, str, float]]:
    """Parse one or more CSV files into a list of transactions."""
    if isinstance(paths, str):
        paths = [paths]

    all_tx: List[Tuple[date, str, float]] = []
    for path in paths:
        all_tx.extend(_parse_csv_file(path))
    return all_tx


def summarize(
    transactions: Iterable[Tuple[date, str, float]],
) -> Tuple[dict[str, float], dict[Tuple[int, int], dict[str, float]], float]:
    """Aggregate transactions by category and month."""
    category_totals: dict[str, float] = defaultdict(float)
    by_month: dict[Tuple[int, int], dict[str, float]] = defaultdict(
        lambda: {"income": 0.0, "expenses": 0.0}
    )
    for tx_date, category, amount in transactions:
        category_totals[category] += amount
        key = (tx_date.year, tx_date.month)
        if amount >= 0:
            by_month[key]["income"] += amount
        else:
            by_month[key]["expenses"] += -amount
    overall = sum(category_totals.values())
    return category_totals, by_month, overall


def savings_rate(
    month_data: dict[Tuple[int, int], dict[str, float]],
) -> dict[str, float]:
    """Compute savings rate percentage for each month."""
    rates: dict[str, float] = {}
    for (year, month), values in month_data.items():
        income = values["income"]
        expenses = values["expenses"]
        if income > 0:
            rate = (income - expenses) / income * 100
            rates[f"{year}-{month:02d}"] = rate
    return rates
