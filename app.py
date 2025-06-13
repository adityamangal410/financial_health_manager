"""CLI application for summarizing financial transactions."""

from __future__ import annotations

import sys
from typing import Sequence

from fhm import parse_csv, savings_rate, summarize
from fhm.models import Summary


def main(argv: Sequence[str] | None = None) -> None:
    """Entry point for the CLI."""
    if argv is None:
        argv = sys.argv[1:]
    if len(argv) < 1:
        print("Usage: python app.py <transactions.csv> [more.csv ...]")
        raise SystemExit(1)

    transactions = parse_csv(argv)
    cat_totals, month_data, overall = summarize(transactions)
    summary = Summary(
        category_totals=cat_totals,
        savings_rate=savings_rate(month_data),
        overall_balance=overall,
    )
    print("Category Totals")
    for cat, total in summary.category_totals.items():
        print(f"{cat:10s} {total:.2f}")
    print(f"Overall Balance: {summary.overall_balance:.2f}")
    rates = summary.savings_rate
    if rates:
        print("\nSavings Rate by Month")
        for month, rate in sorted(rates.items()):
            print(f"{month}: {rate:.1f}%")


if __name__ == "__main__":
    main()
