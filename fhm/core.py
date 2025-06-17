"""Core finance utilities for parsing CSVs and generating summaries."""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import date, datetime
from typing import Iterable, List, Optional, Sequence, Tuple, Union

import pandas as pd
from .models import Summary, Transaction


def _find_header_line(lines: list[str]) -> Optional[int]:
    """Return the index of the header row within ``lines``.

    The header row is identified by the presence of one of the
    known :data:`DATE_FIELDS` values.
    """
    for i, line in enumerate(lines):
        columns = [c.strip().lower() for c in line.split(",")]
        if len(columns) < 3:
            continue
        if any(col in DATE_FIELDS for col in columns):
            return i
    return None


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

AMOUNT_FIELDS = {"amount", "amount ($)"}
CREDIT_FIELDS = {"credit"}
DEBIT_FIELDS = {"debit"}


logger = logging.getLogger(__name__)


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
    """Return the index of the first matching option in ``header``.

    Whitespace and casing differences are ignored when comparing column names.
    """
    normalized = [str(h).strip().lower() for h in header]
    for name in options:
        if name in normalized:
            return normalized.index(name)
    return None


def _parse_csv_file(path: str) -> List[Transaction]:
    """Parse a single CSV file of transactions.

    The CSV is expected to contain a header row. Columns may be named using any
    of the values in ``DATE_FIELDS``, ``CATEGORY_FIELDS``, ``AMOUNT_FIELDS``,
    ``CREDIT_FIELDS`` or ``DEBIT_FIELDS``.
    """
    logger.info("Parsing CSV file %s", path)

    with open(path) as fh:
        lines = fh.readlines()

    header_line = _find_header_line(lines)
    if header_line is None:
        logger.error("Date column not found in %s: %s", path, lines[:5])
        raise ValueError("Date column not found; please preprocess the file.")

    df = pd.read_csv(
        path,
        skiprows=header_line,
        header=0,
        skip_blank_lines=True,
        on_bad_lines="skip",
        engine="python",
        index_col=False,
    )

    header = [str(col) for col in df.columns]

    date_idx = _find_index(header, DATE_FIELDS)
    if date_idx is None:
        logger.error("Date column not found in %s: %s", path, header)
        raise ValueError("Date column not found; please preprocess the file.")

    amount_idx = _find_index(header, AMOUNT_FIELDS)
    credit_idx = _find_index(header, CREDIT_FIELDS)
    debit_idx = _find_index(header, DEBIT_FIELDS)
    category_idx = _find_index(header, CATEGORY_FIELDS)
    logger.debug(
        "Header indexes for %s - date: %s, amount: %s, credit: %s, debit: %s, category: %s",
        path,
        date_idx,
        amount_idx,
        credit_idx,
        debit_idx,
        category_idx,
    )

    transactions: List[Transaction] = []

    for _, row in df.iterrows():
        try:
            tx_date = _parse_date(str(row.iloc[date_idx]))
            if amount_idx is not None:
                amount = _parse_amount(str(row.iloc[amount_idx]))
            else:
                credit = (
                    _parse_amount(str(row.iloc[credit_idx]))
                    if credit_idx is not None
                    else 0.0
                )
                debit = (
                    _parse_amount(str(row.iloc[debit_idx]))
                    if debit_idx is not None
                    else 0.0
                )
                amount = credit - debit
            category = (
                str(row.iloc[category_idx])
                if category_idx is not None
                else "uncategorized"
            )
        except (KeyError, ValueError, IndexError):
            logger.warning("Skipping malformed row in %s: %s", path, row.tolist())
            continue
        transactions.append(Transaction(date=tx_date, category=category, amount=amount))

    logger.info("Parsed %d transactions from %s", len(transactions), path)
    return transactions


def parse_csv(paths: Union[str, Sequence[str]]) -> List[Transaction]:
    """Parse one or more CSV files into a list of transactions."""
    if isinstance(paths, str):
        paths = [paths]

    all_tx: List[Transaction] = []
    for path in paths:
        try:
            tx = _parse_csv_file(path)
        except Exception as exc:  # pragma: no cover - logging
            logger.exception("Failed to parse %s", path)
            raise exc
        all_tx.extend(tx)
    return all_tx


def summarize(transactions: Iterable[Transaction]) -> Summary:
    """Aggregate transactions by category and month."""
    tx_list = list(transactions)
    logger.debug("Summarizing %d transactions", len(tx_list))
    category_totals: dict[str, float] = defaultdict(float)
    by_month: dict[Tuple[int, int], dict[str, float]] = defaultdict(
        lambda: {"income": 0.0, "expenses": 0.0}
    )
    for tx in tx_list:
        category_totals[tx.category] += tx.amount
        key = (tx.date.year, tx.date.month)
        if tx.amount >= 0:
            by_month[key]["income"] += tx.amount
        else:
            by_month[key]["expenses"] += -tx.amount
    overall = sum(category_totals.values())
    logger.debug("Overall balance computed: %s", overall)
    return Summary(
        category_totals=category_totals,
        savings_rate=savings_rate(by_month),
        overall_balance=overall,
    )


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
    logger.debug("Savings rates computed: %s", rates)
    return rates
