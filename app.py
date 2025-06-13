import csv
import sys
from collections import defaultdict
from datetime import date


def parse_csv(path: str):
    transactions = []
    with open(path, newline="") as f:
        reader = csv.reader(f)
        for row in reader:
            if not row:
                continue
            tx_date = date.fromisoformat(row[0])
            category = row[1]
            amount = float(row[2])
            transactions.append((tx_date, category, amount))
    return transactions


def summarize(transactions):
    category_totals = defaultdict(float)
    by_month = defaultdict(lambda: {"income": 0.0, "expenses": 0.0})
    for tx_date, category, amount in transactions:
        category_totals[category] += amount
        key = (tx_date.year, tx_date.month)
        if amount >= 0:
            by_month[key]["income"] += amount
        else:
            by_month[key]["expenses"] += -amount
    overall = sum(category_totals.values())
    return category_totals, by_month, overall


def savings_rate(month_data):
    rates = {}
    for (year, month), values in month_data.items():
        income = values["income"]
        expenses = values["expenses"]
        if income > 0:
            rate = (income - expenses) / income * 100
            rates[f"{year}-{month:02d}"] = rate
    return rates


def main():
    if len(sys.argv) != 2:
        print("Usage: python app.py <transactions.csv>")
        raise SystemExit(1)
    path = sys.argv[1]
    transactions = parse_csv(path)
    cat_totals, month_data, overall = summarize(transactions)
    print("Category Totals")
    for cat, total in cat_totals.items():
        print(f"{cat:10s} {total:.2f}")
    print(f"Overall Balance: {overall:.2f}")
    rates = savings_rate(month_data)
    if rates:
        print("\nSavings Rate by Month")
        for month, rate in sorted(rates.items()):
            print(f"{month}: {rate:.1f}%")


if __name__ == "__main__":
    main()
