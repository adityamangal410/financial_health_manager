"""HTTP server exposing financial summary endpoints."""

from typing import List
from tempfile import NamedTemporaryFile
import os

from fastapi import FastAPI, File, UploadFile
from fastmcp.server import FastMCP
from fhm.models import Summary

from fhm import parse_csv, savings_rate, summarize

mcp_server = FastMCP("FinancialHealthManager")


@mcp_server.tool()
def summarize_csvs(paths: list[str]) -> Summary:
    """Summarize one or more CSV files given by path."""
    transactions = parse_csv(list(paths))
    cat_totals, month_data, overall = summarize(transactions)
    return Summary(
        category_totals=cat_totals,
        savings_rate=savings_rate(month_data),
        overall_balance=overall,
    )


app = FastAPI(title="Financial Health Manager")


@app.get("/")
async def root() -> dict[str, str]:
    """Basic health check."""
    return {"message": "Financial Health Manager"}


@app.post("/summarize", response_model=Summary)
async def summarize_endpoint(files: List[UploadFile] = File(...)) -> Summary:
    """Return summary statistics for uploaded CSV files."""
    paths = []
    for f in files:
        data = await f.read()
        temp = NamedTemporaryFile(delete=False)
        temp.write(data)
        temp.close()
        paths.append(temp.name)

    transactions = parse_csv(paths)
    cat_totals, month_data, overall = summarize(transactions)
    summary = Summary(
        category_totals=cat_totals,
        savings_rate=savings_rate(month_data),
        overall_balance=overall,
    )
    for path in paths:
        os.unlink(path)
    return summary


if __name__ == "__main__":
    mcp_server.run()
