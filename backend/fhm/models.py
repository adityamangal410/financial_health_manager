"""Pydantic models used by Financial Health Manager."""

from __future__ import annotations

from datetime import date
from pydantic import BaseModel


class Transaction(BaseModel):
    """Single financial transaction."""

    date: date
    description: str
    category: str
    amount: float
    account: str | None = None


class Summary(BaseModel):
    """Aggregated financial results."""

    category_totals: dict[str, float]
    savings_rate: dict[str, float]
    overall_balance: float
