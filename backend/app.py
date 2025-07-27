"""CLI application for summarizing financial transactions."""

from __future__ import annotations

import argparse
import logging
import sys
from typing import Sequence

from fhm import (
    get_month_details,
    parse_csv,
    summarize,
    yoy_monthly_expenses,
)

logger = logging.getLogger(__name__)


def build_parser() -> argparse.ArgumentParser:
    """Return a configured argument parser."""

    parser = argparse.ArgumentParser(description="Summarize financial data")
    parser.add_argument("files", nargs="+", help="CSV files to process")
    parser.add_argument(
        "--month",
        metavar="YYYY-MM",
        help="Show category totals for a specific month",
    )
    parser.add_argument(
        "--yoy",
        action="store_true",
        help="Display average expenses for each month across years",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> None:
    """Entry point for the CLI."""

    if argv is None:
        argv = sys.argv[1:]

    parser = build_parser()
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO)
    logger.info("Processing %d input file(s)", len(args.files))

    transactions = parse_csv(args.files)
    summary = summarize(transactions)
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

    if args.month:
        details = get_month_details(transactions, args.month)
        if details:
            print(f"\nDetails for {args.month}")
            for cat, total in sorted(details.items(), key=lambda i: -abs(i[1])):
                print(f"{cat:10s} {total:.2f}")
        else:
            print(f"No transactions found for {args.month}")

    if args.yoy:
        trends = yoy_monthly_expenses(transactions)
        if trends:
            print("\nAverage Expenses by Month")
            for month, avg in sorted(trends.items()):
                print(f"{month}: {avg:.2f}")


if __name__ == "__main__":
    main()
