"""Pydantic models used by Financial Health Manager."""

from __future__ import annotations

from pydantic import BaseModel


class Summary(BaseModel):
    """Aggregated financial results."""

    category_totals: dict[str, float]
    savings_rate: dict[str, float]
    overall_balance: float
