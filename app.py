"""CLI application for summarizing financial transactions."""

from __future__ import annotations

import sys
import logging
from typing import Sequence

from fhm import parse_csv, savings_rate, summarize
from fhm.models import Summary

logger = logging.getLogger(__name__)


def main(argv: Sequence[str] | None = None) -> None:
    """Entry point for the CLI."""
    if argv is None:
        argv = sys.argv[1:]
    if len(argv) < 1:
        print("Usage: python app.py <transactions.csv> [more.csv ...]")
        raise SystemExit(1)
    logging.basicConfig(level=logging.INFO)
    logger.info("Processing %d input file(s)", len(argv))

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
    logger.info("Overall balance: %.2f", summary.overall_balance)
    rates = summary.savings_rate
    if rates:
        print("\nSavings Rate by Month")
        for month, rate in sorted(rates.items()):
            print(f"{month}: {rate:.1f}%")
    logger.debug("Savings rates: %s", rates)


if __name__ == "__main__":
    main()
