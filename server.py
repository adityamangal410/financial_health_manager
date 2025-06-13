"""HTTP server exposing financial summary endpoints."""

from typing import List
from tempfile import NamedTemporaryFile
import os
import logging

from fastapi import FastAPI, File, UploadFile
from fastmcp.server import FastMCP
from fhm.models import Summary

from fhm import parse_csv, summarize

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
    for f in files:
        data = await f.read()
        temp = NamedTemporaryFile(delete=False)
        temp.write(data)
        temp.close()
        paths.append(temp.name)

    transactions = parse_csv(paths)
    summary = summarize(transactions)
    for path in paths:
        os.unlink(path)
    logger.debug("Summary from endpoint computed: %s", summary.json())
    return summary


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting MCP server")
    mcp_server.run()
