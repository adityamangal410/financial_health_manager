"""HTTP server exposing financial summary endpoints."""

from typing import List
from tempfile import NamedTemporaryFile
import os
import logging

from fastapi import FastAPI, File, UploadFile
from fastmcp.server import FastMCP
from fhm.models import Summary, Transaction
from fhm.pb_client import get_pocketbase_client

from fhm import get_month_details, parse_csv, summarize, yoy_monthly_expenses

logger = logging.getLogger(__name__)

mcp_server = FastMCP("FinancialHealthManager")


@mcp_server.tool()
def summarize_csvs(paths: list[str]) -> Summary:
    """Summarize one or more CSV files given by path."""
    logger.info("Summarizing CSV files via MCP: %s", paths)
    transactions = parse_csv(list(paths))
    summary = summarize(transactions)
    logger.debug("MCP summary generated. Overall balance: %s", summary.overall_balance)
    return summary


@mcp_server.tool()
def month_details(paths: list[str], month: str) -> dict[str, float]:
    """Return category totals for a specific month."""
    logger.info("Calculating month details for %s via MCP", month)
    transactions = parse_csv(list(paths))
    details = get_month_details(transactions, month)
    logger.debug("MCP month details generated: %s", details)
    return details


@mcp_server.tool()
def yoy_trends(paths: list[str]) -> dict[str, float]:
    """Return average expenses per month across years."""
    logger.info("Calculating YoY trends via MCP")
    transactions = parse_csv(list(paths))
    trends = yoy_monthly_expenses(transactions)
    logger.debug("MCP YoY trends generated: %s", trends)
    return trends


app = FastAPI(title="Financial Health Manager")


@app.get("/")
async def root() -> dict[str, str]:
    """Basic health check."""
    return {"message": "Financial Health Manager"}


@app.post("/summarize", response_model=Summary)
async def summarize_endpoint(files: List[UploadFile] = File(...)) -> Summary:
    """Return summary statistics for uploaded CSV files."""
    paths = []
    logger.info("Received %d file(s) for summarization", len(files))

    # Get PocketBase client
    pb = get_pocketbase_client()
    # TODO: Replace with authenticated user
    user_id = "test_user"

    for f in files:
        data = await f.read()
        temp = NamedTemporaryFile(delete=False)
        temp.write(data)
        temp.close()
        paths.append(temp.name)

        # Create upload record in PocketBase
        try:
            pb.collection("uploads").create(
                {
                    "user": user_id,
                    "file": (os.path.basename(temp.name), temp.file),
                    "status": "pending",
                }
            )
            logger.info("Created upload record for %s", f.filename)
        except Exception as e:
            logger.error("Failed to create upload record for %s: %s", f.filename, e)

    transactions = parse_csv(paths)

    # Create transaction records in PocketBase
    for t in transactions:
        try:
            pb.collection("transactions").create(
                {
                    "user": user_id,
                    "date": t.date.isoformat(),
                    "description": t.description,
                    "amount": t.amount,
                    "category": t.category,
                    "account": t.account,
                }
            )
        except Exception as e:
            logger.error("Failed to create transaction record: %s", e)

    summary = summarize(transactions)
    for path in paths:
        os.unlink(path)
    logger.debug("Summary from endpoint computed: %s", summary.model_dump_json())
    return summary


@app.post("/month/{month}")
async def month_details_endpoint(
    month: str, files: List[UploadFile] = File(...)
) -> dict[str, float]:
    """Return category totals for a specific month."""
    paths: list[str] = []
    logger.info("Received %d file(s) for month details %s", len(files), month)
    for f in files:
        data = await f.read()
        temp = NamedTemporaryFile(delete=False)
        temp.write(data)
        temp.close()
        paths.append(temp.name)

    transactions = parse_csv(paths)
    details = get_month_details(transactions, month)
    for path in paths:
        os.unlink(path)
    logger.debug("Month details computed for %s: %s", month, details)
    return details


@app.post("/yoy")
async def yoy_endpoint(files: List[UploadFile] = File(...)) -> dict[str, float]:
    """Return average expenses per month across years."""
    paths: list[str] = []
    logger.info("Received %d file(s) for YoY trends", len(files))
    for f in files:
        data = await f.read()
        temp = NamedTemporaryFile(delete=False)
        temp.write(data)
        temp.close()
        paths.append(temp.name)

    transactions = parse_csv(paths)
    trends = yoy_monthly_expenses(transactions)
    for path in paths:
        os.unlink(path)
    logger.debug("YoY trends computed: %s", trends)
    return trends


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting MCP server")
    mcp_server.run()
